const test = require("node:test");
const assert = require("node:assert/strict");
const {
  cleanupTestEnv,
  initTestEnv
} = require("./helpers");

let envRoot;
let db;
let seedDemo;

test.before(() => {
  const env = initTestEnv();
  envRoot = env.root;

  db = require("../db");
  seedDemo = require("../scripts/seed-demo").seedDemo;
});

test.after(() => {
  cleanupTestEnv(envRoot);
});

test("demo seed creates idempotent local evaluation data", () => {
  const first = seedDemo();
  const second = seedDemo();

  assert.equal(first.domain, "openarca.demo");
  assert.deepEqual(second, first);

  const demoUsers = db
    .prepare("SELECT email, role FROM users WHERE email LIKE ? ORDER BY email")
    .all("%@openarca.demo");
  assert.deepEqual(demoUsers, [
    { email: "developer@openarca.demo", role: "developer" },
    { email: "observer@openarca.demo", role: "user" },
    { email: "reporter@openarca.demo", role: "user" }
  ]);

  const ticketCount = db.prepare("SELECT COUNT(*) AS count FROM tickets WHERE number BETWEEN 9001 AND 9005").get();
  assert.equal(ticketCount.count, 5);

  const activeTasks = db
    .prepare("SELECT COUNT(*) AS count FROM dev_tasks WHERE created_by = ? AND status IN ('todo', 'in_progress')")
    .get("22222222-2222-4222-8222-222222222222");
  assert.equal(activeTasks.count, 2);

  const allowedDomains = JSON.parse(db.prepare("SELECT value FROM settings WHERE key = 'allowed_domains'").get().value);
  assert.equal(allowedDomains.includes("openarca.demo"), true);
});
