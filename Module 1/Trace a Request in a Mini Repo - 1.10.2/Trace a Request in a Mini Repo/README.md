# GrowLog — Bonus Exercise Provided Repo

## What's in Here

The `growlog-mini-repo/` folder is a working Express API with:
- `index.js` — server entry point, registers routes
- `middleware/auth.js` — Bearer token authentication
- `handlers/getReport.js` — fetches a report AND does something extra
- `services/notifier.js` — sends access log notifications

---

## Your Four Deliverables (branch: `trace-and-fix`)

### Part 1 — Trace (write `trace-report.md`)

Fill in this 7-field template — **under 80 words total**, one line per field:

```
Entry:       [file + line] — [one line: route matched, params extracted]
Middleware:  [file + line] — [one line: what authenticate checks and attaches]
Handler:     [file + line] — [one line: what getReport does, in order]
Response:    [status codes returned: 200 / 401 / 403 / 404]

Drift:       [file + line] — [what the handler does that the diagram never showed]
Consequence: [one sentence — what breaks if this is left unfixed]
LU violated: [LU number] — [principle name]
```

### Part 2 — Fix (write code)

Fix the design drift in three files:

**`handlers/getReport.js`** — remove the `notifier.sendAccessLog(...)` call. Handler should only fetch and return the report.

**`middleware/accessLogger.js`** (new file) — write an Express middleware that fires the access log after the response is sent:

```javascript
const notifier = require('../services/notifier');

function accessLogger(req, res, next) {
  res.on('finish', () => {
    // call notifier.sendAccessLog only if res.statusCode === 200
  });
  next();
}

module.exports = { accessLogger };
```

**`index.js`** — register `accessLogger` between `authenticate` and `reportHandler`:

```javascript
app.get('/reports/:id', authenticate, accessLogger, reportHandler);
```

---

## Verify It Works

```bash
cd growlog-mini-repo
npm install
node index.js
```

In another terminal:
```bash
curl -H "Authorization: Bearer token-valid-123" http://localhost:3000/reports/1
```

You should see the report JSON returned AND `[NOTIFIER] Logged: ...` printed in the server terminal — after the response.

---

## Findings

During the request trace of `GET /reports/:id`, a design drift was identified in `handlers/getReport.js` where the handler directly awaited `notifier.sendAccessLog(...)` before sending the HTTP response. This violated the Single Responsibility Principle (LU 1.5) by adding client latency and coupling report retrieval to notification side-effects; it was fixed by moving the audit logging logic into a dedicated post-response Express middleware (`accessLogger.js`) using `res.on('finish')`.

