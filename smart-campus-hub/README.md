# Campusly — Smart Campus Hub

A polished React + Vite starter for an 8-hour campus hackathon. Includes a responsive student dashboard, event feed, confidential complaint submission, Campus Copilot chat, Supabase integration, and n8n webhook utilities.

## Included
- React 19 + Vite, Tailwind CSS v4 plugin, Lucide React, Framer Motion
- Supabase client using public environment variables
- SQL schema and Row Level Security (RLS) policies in `supabase/schema.sql`
- Complaint form writes to `complaints`, then notifies an n8n webhook
- Campus Copilot sends messages to an n8n webhook; expected response `{ "answer": "..." }`
- Public event feed with demo fallback; authenticated admin event creation protected by Supabase Auth and RLS
- Responsive design and reduced-motion support

## Run locally

Requirements: Node.js 20.19+ or 22.12+ recommended.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Connect Supabase
1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Copy the project URL and anon/publishable key into `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Restart Vite after changing environment variables.
5. Create admin user accounts through Supabase Auth. A trusted project owner must assign `app_metadata.role = "admin"` server-side / through a trusted admin process. Never allow users to set their own app metadata. Log in again after role assignment.
6. Set up password recovery and appropriate staff access before using this for real complaints.

## Connect n8n
1. Create and activate the complaint workflow described in `n8n/README.md`.
2. Create and activate the Campus Copilot workflow with Google Sheets and Gemini nodes.
3. Paste both production webhook URLs into `.env.local`.
4. Restart the Vite dev server. For deployed builds, configure the same variables in your hosting provider and redeploy.

## Important privacy and security notes
- A hidden management button is not security. Event creation is protected by Supabase Auth plus RLS, not by hiding the UI.
- Complaint reports are confidential, not anonymous, because Student ID is collected. RLS intentionally prevents public reading of complaint rows. Do not add a public SELECT policy.
- This browser starter calls the n8n webhook directly. Webhook URLs included in a Vite build are visible to users; do not put credentials or secrets in `VITE_*` values. For production, use an authenticated server/Edge Function relay, rate limiting, abuse protection, and retryable delivery.
- For real ragging/harassment reports, establish a staffed response process and clear escalation policy before launch. Do not promise confidentiality beyond what your college can actually enforce.
- Demo event cards appear until Supabase is configured and has live event rows.
- This is a hackathon-ready starter, not a security-audited production service. Perform institutional review, testing, backups, monitoring, and accessibility checks before production use.

## Build

```bash
npm run build
npm run preview
```

Deploy the `dist/` output to Vercel, Netlify, or another static host. Add the `VITE_*` environment variables in the host settings.

## Suggested 8-hour hackathon plan
1. Hour 1: Supabase project + schema + env setup.
2. Hours 2–3: wire complaint flow and test RLS.
3. Hours 4–5: build n8n calendar workflow and test response contract.
4. Hour 6: add event rows and configure admin role.
5. Hour 7: mobile QA, error states, accessibility, demo data.
6. Hour 8: deploy, test end-to-end, prepare demo script.

## Project structure

```text
smart-campus-hub/
├── src/
│   ├── lib/
│   │   ├── api.js
│   │   └── supabase.js
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── supabase/schema.sql
├── n8n/README.md
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```
