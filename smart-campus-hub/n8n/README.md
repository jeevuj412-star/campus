# n8n workflow wiring

Set the webhook URLs in `.env.local`. Use HTTPS production webhook URLs after activating each workflow.

## 1) Complaint notification workflow

Suggested nodes:
1. **Webhook** — POST path `campus-complaint`, response mode "Using Respond to Webhook" or "Immediately".
2. **Edit Fields / Set** — map `event`, `sent_at`, `complaint.id`, `complaint.student_id`, `complaint.category`, `complaint.description`, and `complaint.created_at`.
3. **Routing / notification** — notify the authorized campus support channel (for example, an approved email or Teams channel). Restrict access to this workflow and limit who receives complaint details.
4. **Respond to Webhook** — return JSON such as `{ "ok": true }`.

The browser saves the complaint to Supabase first, then sends a notification event. If n8n is down, the complaint remains saved. For production reliability, replace the browser-to-webhook notification with a database trigger/Edge Function or an authenticated server relay plus retries; never put secrets in `VITE_*` variables.

## 2) Campus Copilot workflow

Suggested nodes:
1. **Webhook** — POST path `campus-copilot`; expect `{ message, conversation, timezone, current_date, source }`. Activate the workflow and use its **Production URL** in `.env.local`; the Test URL only works while the editor is listening for a test event. An HTTP 404 from the proxy means n8n did not find an active webhook at the configured URL.
2. **Google Sheets** — read a curated calendar sheet. Suggested columns: `event_name`, `start_date`, `end_date`, `event_type`, `audience`, `official_notes`, `last_updated`.
3. **Filter / Code** — select rows relevant to the question and the provided current date. Do not rely on the LLM to invent dates absent from the sheet.
4. **Gemini Chat Model / AI Agent** — summarize only the supplied calendar rows; if no matching information is present, say so and direct the student to the official college noticeboard.
5. **Respond to Webhook** — return JSON `{ "answer": "..." }`, which the frontend understands.

The local Vite dev and preview servers proxy `/api/campus-copilot` to the webhook URL in `.env.local`, avoiding browser CORS restrictions during local development. For a deployed frontend, configure the Webhook node's **Allowed Origins (CORS)** for the exact deployed site origin, with the matching `Access-Control-Allow-Origin` response header, or provide an equivalent server-side proxy. Test from the browser origin, not only with curl. For an 8-hour hackathon demo, a public webhook is convenient but can be abused; add authentication, rate limiting, input validation, and request logging before production.

If the app reports HTTP 500, the request reached n8n but a workflow node failed. Open the latest failed execution in n8n, inspect the first red node and its error, then confirm the final response returns JSON such as `{"answer":"..."}`. If it reports HTTP 404, activate the workflow and confirm `.env.local` uses the matching Production URL.

## Google Sheet example

| event_name | start_date | end_date | event_type | audience | official_notes | last_updated |
|---|---|---|---|---|---|---|
| Mid-semester exams | 2026-11-16 | 2026-11-21 | Exam | All students | Confirm room on portal | 2026-11-01 |

## Test the webhook

```bash
curl -X POST "$VITE_N8N_COPILOT_WEBHOOK" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"When are the next exams?","conversation":[],"timezone":"Asia/Kolkata","current_date":"2026-11-01"}'
```

Expected response: `{"answer":"The sheet-backed summary goes here."}`
