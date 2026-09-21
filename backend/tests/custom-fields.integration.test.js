const test = require("node:test");
const assert = require("node:assert/strict");
const supertest = require("supertest");
const {
  cleanupTestEnv,
  initTestEnv,
  loginByOtp,
  makeBugPayload,
  uniqueEmail
} = require("./helpers");

let envRoot;
let app;
let db;
let request;
let userAuth;
let devAuth;
let projectId;

test.before(async () => {
  const env = initTestEnv();
  envRoot = env.root;

  app = require("../app");
  db = require("../db");
  request = supertest(app);

  db.prepare("UPDATE settings SET value = ? WHERE key = 'allowed_domains'").run(
    JSON.stringify(["example.com"])
  );

  const devEmail = uniqueEmail("dev-custom-fields");
  db.prepare("UPDATE settings SET value = ? WHERE key = 'developer_emails'").run(
    JSON.stringify([devEmail])
  );

  userAuth = await loginByOtp({ request, db, email: uniqueEmail("user-custom-fields") });
  devAuth = await loginByOtp({ request, db, email: devEmail });

  const project = await request
    .post("/api/projects")
    .set("Authorization", `Bearer ${devAuth.token}`)
    .send({ name: "Marketplace" });

  assert.equal(project.statusCode, 201);
  projectId = project.body.id;
});

test.after(() => {
  cleanupTestEnv(envRoot);
});

async function defineField(payload) {
  return request
    .post(`/api/projects/${projectId}/custom-fields`)
    .set("Authorization", `Bearer ${devAuth.token}`)
    .send(payload);
}

test("a developer defines fields, a standard user cannot", async () => {
  const created = await defineField({
    field_key: "order_number",
    label: "Order number",
    field_type: "text"
  });
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.field_key, "order_number");

  const channel = await defineField({
    field_key: "channel",
    label: "Channel",
    field_type: "select",
    options: ["pl", "it"],
    required: true
  });
  assert.equal(channel.statusCode, 201);

  const denied = await request
    .post(`/api/projects/${projectId}/custom-fields`)
    .set("Authorization", `Bearer ${userAuth.token}`)
    .send({ field_key: "sneaky", label: "Sneaky", field_type: "text" });
  assert.equal(denied.statusCode, 403);
});

test("definitions are per project", async () => {
  const other = await request
    .post("/api/projects")
    .set("Authorization", `Bearer ${devAuth.token}`)
    .send({ name: "Unrelated" });
  assert.equal(other.statusCode, 201);

  const fields = await request
    .get(`/api/projects/${other.body.id}/custom-fields`)
    .set("Authorization", `Bearer ${devAuth.token}`);

  assert.equal(fields.statusCode, 200);
  assert.deepEqual(fields.body.items, []);
});

test("a ticket carries its custom field values", async () => {
  const created = await request
    .post("/api/tickets")
    .set("Authorization", `Bearer ${userAuth.token}`)
    .send(
      makeBugPayload({
        project_id: projectId,
        custom_fields: { order_number: "ZN-1001", channel: "it" }
      })
    );

  assert.equal(created.statusCode, 201);

  const detail = await request
    .get(`/api/tickets/${created.body.id}`)
    .set("Authorization", `Bearer ${userAuth.token}`);

  assert.equal(detail.statusCode, 200);
  const values = Object.fromEntries(
    detail.body.custom_fields.map((field) => [field.field_key, field.value])
  );
  assert.deepEqual(values, { order_number: "ZN-1001", channel: "it" });
});

test("a required field blocks creation with a field-level error", async () => {
  const created = await request
    .post("/api/tickets")
    .set("Authorization", `Bearer ${userAuth.token}`)
    .send(makeBugPayload({ project_id: projectId, custom_fields: { order_number: "ZN-2" } }));

  assert.equal(created.statusCode, 400);
  assert.equal(created.body.error, "field_required");
  assert.equal(created.body.details[0].path[1], "channel");
});

test("a value outside the declared options is refused", async () => {
  const created = await request
    .post("/api/tickets")
    .set("Authorization", `Bearer ${userAuth.token}`)
    .send(makeBugPayload({ project_id: projectId, custom_fields: { channel: "de" } }));

  assert.equal(created.statusCode, 400);
  assert.equal(created.body.error, "invalid_option");
});

test("an unknown field key is refused rather than dropped", async () => {
  const created = await request
    .post("/api/tickets")
    .set("Authorization", `Bearer ${userAuth.token}`)
    .send(
      makeBugPayload({
        project_id: projectId,
        custom_fields: { channel: "pl", not_a_field: "x" }
      })
    );

  assert.equal(created.statusCode, 400);
  assert.equal(created.body.error, "unknown_field");
});

test("a ticket created before a field existed stays readable", async () => {
  const created = await request
    .post("/api/tickets")
    .set("Authorization", `Bearer ${userAuth.token}`)
    .send(makeBugPayload({ project_id: projectId, custom_fields: { channel: "pl" } }));
  assert.equal(created.statusCode, 201);

  const added = await defineField({
    field_key: "vendor_id",
    label: "Vendor",
    field_type: "text"
  });
  assert.equal(added.statusCode, 201);

  const detail = await request
    .get(`/api/tickets/${created.body.id}`)
    .set("Authorization", `Bearer ${userAuth.token}`);

  assert.equal(detail.statusCode, 200);
  // The new field simply has no value here; nothing about the old ticket breaks.
  assert.ok(detail.body.custom_fields.every((field) => field.field_key !== "vendor_id"));
});

test("archiving a definition preserves the values already recorded", async () => {
  const created = await request
    .post("/api/tickets")
    .set("Authorization", `Bearer ${userAuth.token}`)
    .send(
      makeBugPayload({
        project_id: projectId,
        custom_fields: { channel: "it", vendor_id: "V-7" }
      })
    );
  assert.equal(created.statusCode, 201);

  const fields = await request
    .get(`/api/projects/${projectId}/custom-fields`)
    .set("Authorization", `Bearer ${devAuth.token}`);
  const vendorField = fields.body.items.find((field) => field.field_key === "vendor_id");

  const archived = await request
    .delete(`/api/projects/${projectId}/custom-fields/${vendorField.id}`)
    .set("Authorization", `Bearer ${devAuth.token}`);
  assert.equal(archived.statusCode, 204);

  const detail = await request
    .get(`/api/tickets/${created.body.id}`)
    .set("Authorization", `Bearer ${userAuth.token}`);

  // Deleting outright would have taken this value with it, silently changing
  // the history of a ticket that may already be closed.
  const vendorValue = detail.body.custom_fields.find((field) => field.field_key === "vendor_id");
  assert.ok(vendorValue);
  assert.equal(vendorValue.value, "V-7");
  assert.equal(vendorValue.archived, true);

  const active = await request
    .get(`/api/projects/${projectId}/custom-fields`)
    .set("Authorization", `Bearer ${devAuth.token}`);
  assert.ok(active.body.items.every((field) => field.field_key !== "vendor_id"));
});

test("a duplicate active field key is rejected", async () => {
  const duplicate = await defineField({
    field_key: "order_number",
    label: "Order number again",
    field_type: "text"
  });

  assert.equal(duplicate.statusCode, 400);
  assert.equal(duplicate.body.error, "duplicate_field_key");
});
