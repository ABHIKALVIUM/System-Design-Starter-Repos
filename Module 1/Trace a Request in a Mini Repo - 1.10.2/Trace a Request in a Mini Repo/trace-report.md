Entry: index.js:28 — Matches GET /reports/:id and extracts report ID.
Middleware: middleware/auth.js:5 — Validates Bearer token and attaches user.
Handler: handlers/getReport.js:7 — Fetches report, verifies owner, returns JSON.
Response: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found.
Drift: handlers/getReport.js:40 — Awaits notifier service before responding.
Consequence: Awaiting notifier adds latency and couples fetching to notification failure.
LU violated: LU 1.5 — Single Responsibility Principle.
