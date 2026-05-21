const db = require("../db");
const { getSetting, updateSettings } = require("../services/settings");

const DEMO = {
  domain: "openarca.demo",
  users: {
    reporter: "11111111-1111-4111-8111-111111111111",
    developer: "22222222-2222-4222-8222-222222222222",
    observer: "33333333-3333-4333-8333-333333333333"
  },
  projects: {
    support: "44444444-4444-4444-8444-444444444444",
    operations: "55555555-5555-4555-8555-555555555555",
    product: "66666666-6666-4666-8666-666666666666"
  },
  tickets: {
    submitted: "77777777-7777-4777-8777-777777777777",
    inProgress: "88888888-8888-4888-8888-888888888888",
    blocked: "99999999-9999-4999-8999-999999999999",
    waiting: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    closed: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
  }
};

function parseJsonSetting(key, fallback) {
  try {
    return JSON.parse(getSetting(key, JSON.stringify(fallback)));
  } catch (_error) {
    return fallback;
  }
}

function mergeUnique(current, additions) {
  return Array.from(new Set([...(Array.isArray(current) ? current : []), ...additions]));
}

function seedSettings() {
  const allowedDomains = mergeUnique(parseJsonSetting("allowed_domains", []), [
    DEMO.domain,
    "example.com"
  ]);
  const developerEmails = mergeUnique(parseJsonSetting("developer_emails", []), [
    `developer@${DEMO.domain}`
  ]);

  updateSettings({
    app_name: "OpenArca Demo",
    app_url: "http://localhost:3330",
    allowed_domains: JSON.stringify(allowedDomains),
    developer_emails: JSON.stringify(developerEmails)
  });
}

function seedUsers() {
  const stmt = db.prepare(
    `INSERT INTO users (
      id, email, name, role, language, email_notify_ticket_status,
      email_notify_developer_comment, created_at, last_login
    ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      role = excluded.role,
      language = excluded.language,
      last_login = excluded.last_login`
  );

  stmt.run(
    DEMO.users.reporter,
    `reporter@${DEMO.domain}`,
    "Ava Reporter",
    "user",
    "en",
    "2026-05-01T09:00:00.000Z",
    "2026-05-20T08:30:00.000Z"
  );
  stmt.run(
    DEMO.users.developer,
    `developer@${DEMO.domain}`,
    "Liam Developer",
    "developer",
    "en",
    "2026-05-01T09:05:00.000Z",
    "2026-05-20T09:00:00.000Z"
  );
  stmt.run(
    DEMO.users.observer,
    `observer@${DEMO.domain}`,
    "Mia Observer",
    "user",
    "en",
    "2026-05-01T09:10:00.000Z",
    null
  );
}

function seedProjects() {
  const stmt = db.prepare(
    `INSERT INTO projects (id, name, description, color, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      color = excluded.color`
  );

  stmt.run(
    DEMO.projects.support,
    "Customer Support",
    "Incoming customer-facing requests and handoffs.",
    "#0F766E",
    "2026-05-01T10:00:00.000Z"
  );
  stmt.run(
    DEMO.projects.operations,
    "Internal Operations",
    "Back-office processes, access and automation tasks.",
    "#2563EB",
    "2026-05-01T10:05:00.000Z"
  );
  stmt.run(
    DEMO.projects.product,
    "Product Core",
    "Product improvements, bugs and release readiness.",
    "#7C3AED",
    "2026-05-01T10:10:00.000Z"
  );
}

function seedTickets() {
  const stmt = db.prepare(
    `INSERT INTO tickets (
      id, number, title, description, steps_to_reproduce, expected_result,
      actual_result, environment, urgency_reporter, priority, status,
      category, project_id, reporter_id, assignee_id, estimated_hours,
      planned_date, order_index, internal_note, created_at, updated_at, closed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      steps_to_reproduce = excluded.steps_to_reproduce,
      expected_result = excluded.expected_result,
      actual_result = excluded.actual_result,
      environment = excluded.environment,
      urgency_reporter = excluded.urgency_reporter,
      priority = excluded.priority,
      status = excluded.status,
      category = excluded.category,
      project_id = excluded.project_id,
      reporter_id = excluded.reporter_id,
      assignee_id = excluded.assignee_id,
      estimated_hours = excluded.estimated_hours,
      planned_date = excluded.planned_date,
      order_index = excluded.order_index,
      internal_note = excluded.internal_note,
      updated_at = excluded.updated_at,
      closed_at = excluded.closed_at`
  );

  stmt.run(
    DEMO.tickets.submitted,
    9001,
    "New onboarding checklist for finance team",
    "Finance needs a repeatable onboarding checklist for new team members, including account access and initial training tasks.",
    null,
    "New finance hires receive a consistent onboarding flow.",
    "Tasks are currently collected manually across messages.",
    "OpenArca local demo",
    "normal",
    "normal",
    "submitted",
    "improvement",
    DEMO.projects.operations,
    DEMO.users.reporter,
    null,
    null,
    null,
    0,
    null,
    "2026-05-14T09:00:00.000Z",
    "2026-05-14T09:00:00.000Z",
    null
  );

  stmt.run(
    DEMO.tickets.inProgress,
    9002,
    "Checkout webhook retry is missing error visibility",
    "Support cannot see why checkout webhooks fail after a provider outage, so developers need a clearer retry and history view.",
    "Trigger a checkout webhook failure and inspect the ticket history.",
    "Retries and failure reason are visible to the support and developer team.",
    "The failure is only visible in server logs.",
    "Demo provider sandbox",
    "high",
    "high",
    "in_progress",
    "bug",
    DEMO.projects.support,
    DEMO.users.reporter,
    DEMO.users.developer,
    6,
    "2026-05-22",
    1,
    "Demo task: show handoff from ticket to developer TODO.",
    "2026-05-15T10:30:00.000Z",
    "2026-05-20T11:00:00.000Z",
    null
  );

  stmt.run(
    DEMO.tickets.blocked,
    9003,
    "SAML access request needs vendor metadata",
    "The operations team requested SAML setup, but the vendor metadata XML is not available yet.",
    null,
    "Developer can proceed after metadata is attached.",
    "Implementation is blocked waiting for the vendor.",
    "Vendor staging account",
    "normal",
    "normal",
    "blocked",
    "feature",
    DEMO.projects.operations,
    DEMO.users.observer,
    DEMO.users.developer,
    4,
    "2026-05-24",
    2,
    "Blocked by missing external dependency.",
    "2026-05-16T08:45:00.000Z",
    "2026-05-20T12:00:00.000Z",
    null
  );

  stmt.run(
    DEMO.tickets.waiting,
    9004,
    "Release notes draft needs product review",
    "The release notes are ready technically, but product should confirm the final wording before publication.",
    null,
    "Product signs off the release notes and ticket can be closed.",
    "Waiting for final review.",
    "OpenArca release candidate",
    "low",
    "low",
    "waiting",
    "question",
    DEMO.projects.product,
    DEMO.users.reporter,
    DEMO.users.developer,
    2,
    "2026-05-21",
    3,
    null,
    "2026-05-17T13:30:00.000Z",
    "2026-05-20T13:15:00.000Z",
    null
  );

  stmt.run(
    DEMO.tickets.closed,
    9005,
    "Profile notification preferences copy polish",
    "Update the profile notification copy and verify both English and Polish translations.",
    null,
    "Profile copy is clear and translation keys are complete.",
    "Copy was inconsistent between languages.",
    "OpenArca local demo",
    "normal",
    "normal",
    "closed",
    "improvement",
    DEMO.projects.product,
    DEMO.users.reporter,
    DEMO.users.developer,
    3,
    "2026-05-18",
    4,
    null,
    "2026-05-13T15:00:00.000Z",
    "2026-05-18T16:20:00.000Z",
    "2026-05-18T16:20:00.000Z"
  );

  const currentCounter = Number(getSetting("ticket_counter", "0"));
  if (currentCounter < 9005) {
    updateSettings({ ticket_counter: "9005" });
  }
}

function seedComments() {
  const stmt = db.prepare(
    `INSERT INTO comments (
      id, ticket_id, user_id, content, is_developer, is_internal,
      is_closure_summary, type, parent_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'comment', NULL, ?)
    ON CONFLICT(id) DO UPDATE SET
      content = excluded.content,
      is_developer = excluded.is_developer,
      is_internal = excluded.is_internal,
      is_closure_summary = excluded.is_closure_summary`
  );

  stmt.run(
    "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    DEMO.tickets.inProgress,
    DEMO.users.developer,
    "I reproduced the missing retry visibility and am adding a clearer status trail.",
    1,
    0,
    0,
    "2026-05-20T11:05:00.000Z"
  );
  stmt.run(
    "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    DEMO.tickets.blocked,
    DEMO.users.developer,
    "Waiting for SAML metadata from the vendor before continuing.",
    1,
    0,
    0,
    "2026-05-20T12:10:00.000Z"
  );
  stmt.run(
    "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    DEMO.tickets.closed,
    DEMO.users.developer,
    "Closure summary: profile notification copy was updated and both dictionaries were verified.",
    1,
    0,
    1,
    "2026-05-18T16:15:00.000Z"
  );
}

function seedDevTasks() {
  const stmt = db.prepare(
    `INSERT INTO dev_tasks (
      id, title, description, priority, estimated_hours, planned_date,
      status, order_index, ticket_id, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      priority = excluded.priority,
      estimated_hours = excluded.estimated_hours,
      planned_date = excluded.planned_date,
      status = excluded.status,
      order_index = excluded.order_index,
      ticket_id = excluded.ticket_id,
      created_by = excluded.created_by,
      updated_at = excluded.updated_at`
  );

  stmt.run(
    "ffffffff-ffff-4fff-8fff-ffffffffffff",
    "Add webhook retry status trail",
    "Expose retry state and last provider error in the ticket history.",
    "high",
    6,
    "2026-05-22",
    "in_progress",
    0,
    DEMO.tickets.inProgress,
    DEMO.users.developer,
    "2026-05-20T11:00:00.000Z",
    "2026-05-20T11:00:00.000Z"
  );
  stmt.run(
    "12121212-1212-4212-8212-121212121212",
    "Prepare SAML metadata mapping",
    "Draft the configuration steps while waiting for vendor metadata.",
    "normal",
    4,
    "2026-05-24",
    "todo",
    1,
    DEMO.tickets.blocked,
    DEMO.users.developer,
    "2026-05-20T12:00:00.000Z",
    "2026-05-20T12:00:00.000Z"
  );
}

function seedTemplates() {
  const stmt = db.prepare(
    `INSERT INTO ticket_templates (
      id, name, project_id, category, urgency_reporter, title_template,
      description_template, checklist_json, is_active, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      project_id = excluded.project_id,
      category = excluded.category,
      urgency_reporter = excluded.urgency_reporter,
      title_template = excluded.title_template,
      description_template = excluded.description_template,
      checklist_json = excluded.checklist_json,
      is_active = excluded.is_active,
      updated_at = excluded.updated_at`
  );

  stmt.run(
    "34343434-3434-4434-8434-343434343434",
    "Bug intake with reproduction steps",
    DEMO.projects.support,
    "bug",
    "high",
    "Problem with {{area}}",
    "Describe what happened, who is affected, and why it blocks the workflow.",
    JSON.stringify(["Add reproduction steps", "Attach screenshots or logs", "Confirm expected result"]),
    DEMO.users.developer,
    "2026-05-12T10:00:00.000Z",
    "2026-05-12T10:00:00.000Z"
  );
}

function seedTelemetry() {
  const stmt = db.prepare(
    `INSERT INTO telemetry_events (id, event_name, user_id, ticket_id, properties_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
      event_name = excluded.event_name,
      user_id = excluded.user_id,
      ticket_id = excluded.ticket_id,
      properties_json = excluded.properties_json,
      created_at = excluded.created_at`
  );

  const events = [
    ["45454545-4545-4454-8454-454545454545", "ticket.created", DEMO.users.reporter, DEMO.tickets.submitted, "{}"],
    ["56565656-5656-4565-8565-565656565656", "board.drag", DEMO.users.developer, DEMO.tickets.inProgress, "{\"from\":\"verified\",\"to\":\"in_progress\"}"],
    ["67676767-6767-4676-8676-676767676767", "devtodo.reorder", DEMO.users.developer, null, "{}"],
    ["78787878-7878-4787-8787-787878787878", "ticket.closed", DEMO.users.developer, DEMO.tickets.closed, "{}"]
  ];

  for (const [id, eventName, userId, ticketId, propertiesJson] of events) {
    stmt.run(id, eventName, userId, ticketId, propertiesJson, "2026-05-20T14:00:00.000Z");
  }
}

function seedDemo() {
  const tx = db.transaction(() => {
    seedSettings();
    seedUsers();
    seedProjects();
    seedTickets();
    seedComments();
    seedDevTasks();
    seedTemplates();
    seedTelemetry();
  });

  tx();

  return {
    domain: DEMO.domain,
    users: {
      reporter: `reporter@${DEMO.domain}`,
      developer: `developer@${DEMO.domain}`,
      observer: `observer@${DEMO.domain}`
    },
    tickets: Object.keys(DEMO.tickets).length,
    projects: Object.keys(DEMO.projects).length
  };
}

if (require.main === module) {
  const result = seedDemo();
  console.log("OpenArca demo data seeded:");
  console.log(JSON.stringify(result, null, 2));
}

module.exports = {
  DEMO,
  seedDemo
};
