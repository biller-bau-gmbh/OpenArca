# Open Core Next Plan

Scope: public OpenArca repository only. Enterprise-only capabilities stay in the separate Enterprise track.

## 0.2.7-rc1 - Quality gates and i18n hardening

- Stabilize frontend tests and runtime storage access in non-browser environments.
- Add an automated i18n guard:
  - `en.json` and `pl.json` must expose the same translation keys.
  - English translations must not contain Polish diacritics.
  - Runtime frontend source must not contain hardcoded Polish UI copy outside `pl.json` and tests.
  - Static `t("...")` keys must exist in both dictionaries.
- Stabilize backend test script and document/support the actual Node runtime range.

## 0.2.8-rc1 - Self-hosting readiness

- Add an admin readiness view for core configuration:
  - application URL,
  - allowed domains,
  - SMTP/SES setup,
  - backup/restore visibility,
  - current version.
- Improve diagnostics for email provider test failures.
- Add or document seed/demo data for local evaluation.

## 0.2.9-rc1 - Open Core analytics UI

- Build a UI for existing activation and usage stats.
- Surface 30-day usage, activation funnel and daily activity in the admin/developer area.
- Keep metrics local and self-host friendly.

## 0.3.0 - Open Core stabilization milestone

- Consolidate saved views and quick presets across `My Tickets`, `Kanban` and `DevTodo`.
- Refactor the app shell into smaller navigation, branding, language and user-menu units.
- Polish ticket lifecycle UX:
  - clearer activity/history,
  - stronger closure summary flow,
  - better next-action hints on dashboard and ticket detail.
- Refresh README/CONTRIBUTING/docs around the stabilized self-host flow.
