# Students Affairs: UoN Missing Marks Clearinghouse

A web portal where University of Nairobi students report missing or disputed marks, lecturers resolve them, and department administrators track every claim until the corrected mark is in the university's records system. Each claim is a ticket with evidence, a discussion thread and a status history. Everyone involved gets an email when something changes.

![A student's portal with their claim tickets](docs/screenshots/student-portal.png)

> The screenshots use the demo accounts and claims that the backend creates on a fresh database (see [Screenshots](#screenshots)).

## Contents

- [Who this is for](#who-this-is-for)
- [Features](#features)
- [Architecture](#architecture)
- [Running it locally](#running-it-locally)
- [Configuration](#configuration)
- [Roles and sign-in](#roles-and-sign-in)
- [Claims (tickets)](#claims-tickets)
- [API](#api)
- [Project layout](#project-layout)
- [Tests](#tests)
- [Deployment](#deployment)
- [Security notes](#security-notes)
- [Known limitations](#known-limitations)
- [Screenshots](#screenshots)

## Who this is for

This README is for developers. Students, lecturers and administrators should read the [user guide](docs/user-guide.md).

## Features

| Who | Can |
|---|---|
| **Students** | File a missing or disputed mark in four steps: an integrity checklist, academic details, the claim itself with up to three evidence files, then submit. Then follow each claim's status and reply to the lecturer |
| **Lecturers** | Work through a claims queue with statistics and filters, review evidence, set the verified mark and status, comment, escalate to the HOD or an administrator |
| **Administrators** | See every claim on the Claims Board by status and faculty, check lecturers' response rates, review claims quickly, export to CSV |
| **Everyone** | Email updates (status changes for students, new claims for lecturers in batches, escalations for administrators), light and dark themes, works on phones |

| Lecturer's claims queue | Department administrators' board |
|---|---|
| ![Lecturer portal](docs/screenshots/lecturer-portal.png) | ![Admin portal](docs/screenshots/admin-portal.png) |

## Architecture

```text
 browser: React 19 + Vite + Tailwind CSS (Vercel)
   │  /api/*  JSON, sign-in kept in httpOnly cookies (access 15 min, refresh 7 days)
   ▼
 FastAPI (backend/app)
   ├─ auth: Google sign-in, phone codes, development-only demo sign-in
   ├─ tickets: claims, evidence uploads, comments, status changes, escalation
   ├─ SQLAlchemy 2 (async) ─► SQLite (uon_clearinghouse.db)
   ├─ /api/media/  uploaded evidence files
   └─ outside services: Google (sign-in) · SMTP (email) · AdvantaSMS (phone codes)
```

| | |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7, axios, Motion, sonner, `@react-oauth/google` |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2 with `aiosqlite`, pydantic-settings, python-jose (JWT), passlib/bcrypt, google-auth, aiosmtplib, httpx |
| Database | SQLite. Tables are created at startup, and a few columns are added with `ALTER TABLE` |

## Running it locally

You need Node.js 18+ and Python 3.11.

```bash
git clone https://github.com/mr-ceo7/studentaffairs.git
cd studentaffairs
npm install
python3 -m venv backend/.venv && backend/.venv/bin/pip install -r backend/requirements.txt
cp .env.example .env.local               # frontend settings
printf 'DEBUG=true\n' > backend/.env     # backend settings, see Configuration
./start.sh
```

`start.sh` frees ports 3000 and 8000 (it kills whatever is using them), then starts:

| | URL |
|---|---|
| Frontend (Vite) | http://localhost:3000 |
| API | http://localhost:8000 |
| Interactive API docs | http://localhost:8000/docs |

In development the frontend calls the API on port 8000 of the same host, unless `VITE_API_URL` says otherwise.

**Signing in locally.** With `DEBUG=true` in `backend/.env`, the sign-in page shows **Demo & Testing Accounts**: a student, a lecturer, an administrator, and a new student who goes through the profile set-up. These use `/api/auth/mock-sso`, which signs in as any UoN address without a password, so it is refused unless `DEBUG` is on. Google sign-in needs `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.

**Demo data.** On startup the backend creates the demo accounts and four example claims if they aren't there yet (`seed_default_data` in `backend/app/main.py`).

## Configuration

### Backend (`backend/.env` or environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./uon_clearinghouse.db` | Database, relative to where the backend runs |
| `DEBUG` | `false` | Development mode: turns on the demo sign-in. **Never on in production** |
| `JWT_SECRET_KEY` | a development value | Signs sign-in tokens. Set a long random value in production |
| `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` | `HS256`, `15`, `7` | Token settings |
| `GOOGLE_CLIENT_ID` | empty | Google sign-in |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Comma-separated sites allowed to call the API from a browser. Set it to the real site's addresses in production |
| `FRONTEND_URL`, `BACKEND_URL` | `http://localhost:3000`, `http://localhost:8000` | Links in emails and texts |
| `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `FROM_EMAIL` | `smtp.gmail.com`, `465`, empty | Outgoing email |
| `ADVANTA_SMS_API_KEY`, `ADVANTA_SMS_PARTNER_ID` | empty | AdvantaSMS, for phone sign-in codes. Empty: no texts are sent |
| `PAYMENTS_LIVE`, `MPESA_*`, `PAYPAL_*`, `PAYSTACK_*` | sandbox / empty | Only used by archived payment code (see [Project layout](#project-layout)) |

### Frontend (`.env.local` or the hosting provider)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API address, without `/api`. Default: the same origin in production, port 8000 of the same host in development |
| `VITE_GOOGLE_CLIENT_ID` | Google sign-in. Without it, the Google button says sign-in isn't configured |

## Roles and sign-in

The role comes from the account:

| Role | Who | Sees |
|---|---|---|
| Student | Anyone not below | Their own claims |
| Lecturer | Any `@uonbi.ac.ke` address that isn't an administrator | The claims queue (all claims) |
| Administrator | Accounts with `is_admin` set in the database, and `admin@uonbi.ac.ke` | The Claims Board and lecturer metrics |

Ways to sign in:

- **Google** (`POST /api/auth/google`) is the production path. Any Google account can sign in. A student without a registration number is asked for their academic profile first.
- **Phone code** (`/api/auth/phone/request-otp`, `/verify-otp`) texts a code through AdvantaSMS (see [Known limitations](#known-limitations)).
- **Demo sign-in** (`POST /api/auth/mock-sso`) is for development only, with `DEBUG=true`. It never grants administrator rights from the request.

Administrator rights are granted in the database (`users.is_admin`), never through sign-in.

## Claims (tickets)

A claim gets an ID like `UON-1047`. It records:

- the student's registration number, faculty, department and unit
- the assessment category (for example CAT, main exam, lab report)
- the claimed mark, and the verified mark once checked
- the lecturer's name and email
- evidence files, completed coursework items, and notes

The statuses, in their usual order (the code doesn't enforce an order):

```text
Submitted to Department/Lecturer ─► Under Departmental Processing ─► Cleared for SMS Update ─► Verified on SMS
            │                                  │
            ├─► Awaiting Student Response ◄────┤  (the lecturer needs more evidence)
            └─► Rejected — Insufficient Proof ◄┘
```

- **Evidence.** Up to 3 files per upload, 3 MB each: PDF, PNG, JPG, JPEG, DOC, DOCX or HEIC. They're saved under `backend/media/uploads/` with random names.
- **Status changes.** Only lecturers and administrators can change a status. A change can carry a comment, and it emails the student.
- **Lecturer emails.** When a claim names a lecturer's email, that lecturer is emailed. Several new claims are batched into one email, which is also flushed at startup. A lecturer who signs in later is linked to the claims that named them.
- **Escalation.** A lecturer or administrator can send a claim to an HOD or administrator by email. That moves it to *Under Departmental Processing* and records it in the thread.

## API

Every route is under `/api`. Interactive documentation is at `/docs` while the backend runs.

| Method and path | Who | Purpose |
|---|---|---|
| `POST /auth/google` | anyone | Sign in with a Google ID token |
| `POST /auth/phone/request-otp`, `POST /auth/phone/verify-otp` | anyone | Sign in with a texted code |
| `POST /auth/mock-sso` | anyone, **`DEBUG` only** | Demo sign-in |
| `POST /auth/refresh`, `POST /auth/logout` | signed in | Renew or end the session |
| `GET /auth/me`, `PUT /auth/me/profile`, `PUT /auth/me/favorites` | signed in | Own account and academic profile |
| `POST /auth/activity`, `GET /auth/onboard` | | Page-view tracking; onboarding check |
| `POST /tickets/upload` | signed in | Upload evidence files |
| `POST /tickets` | students | File a claim |
| `GET /tickets` | signed in | Claims (students: their own), with `faculty` and `status` filters and paging |
| `GET /tickets/{ticket_id}` | owner or staff | One claim with its thread |
| `POST /tickets/{ticket_id}/status` | staff | Change status and verified mark |
| `POST /tickets/{ticket_id}/comments` | owner or staff | Reply in the thread |
| `POST /tickets/{ticket_id}/escalate` | staff | Escalate by email |
| `GET /internal/support-contact` | | Support contact details |
| `GET /health` | anyone | Health check |
| `GET /media/uploads/{file}` | anyone with the link | Evidence files |

## Project layout

```text
src/
  App.tsx                    routes
  components/                Dashboard (picks the portal by role), StudentPortalView, LecturerPortalView,
                             AdminPortalView, TicketDetailModal, Header, BottomNav, …
  pages/                     LoginPage, TicketDetailsPage, About, FAQ, Contact, legal pages
  services/                  apiClient (axios), authService, ticketService
  context/                   user and theme
  pages/archive/, services/archive/, components/archive/
                             carried over from earlier projects (tips, notices, clearance, GPA calculator, payments)
backend/
  app/main.py                app, CORS, startup (tables, demo data, pending lecturer emails), routers
  app/config.py              settings
  app/routers/               auth, tickets, internal  (routers/archive/ isn't mounted)
  app/models/, app/schemas/  users, tickets, comments, activity, settings, ads
  app/services/email_service.py   all outgoing email
  tests/                     pytest
public/                      images used by the site
render.yaml                  Render deployment of the backend
webhook.py                   GitHub webhook receiver that runs the server's deploy script
start.sh                     local development
scripts/docs_screenshots.py  regenerates docs/screenshots/
```

The frontend still has routes for some archived pages (`/catalog`, `/gpa`, `/notices`, `/clearance`). Their backend routers are archived and not mounted, so any part of those pages that calls the API won't work.

## Tests

```bash
cd backend && .venv/bin/python -m pytest -q    # 3 tests, in-memory SQLite
npm test                                       # vitest: 1 test
npm run lint                                   # TypeScript check (see Known limitations)
```

The backend tests read `backend/.env`, and the escalation test sends real email if SMTP is configured there. Blank the SMTP settings when running them: `SMTP_USERNAME= SMTP_PASSWORD= .venv/bin/python -m pytest -q`.

## Deployment

Two setups are described in the repository:

- **Your own server.** `webhook.py` listens for GitHub push webhooks and runs `/var/www/studentsaffairs.com/deploy.sh`, which isn't in the repository.
- **Render** (`render.yaml`) builds the backend from `backend/` and starts `uvicorn app.main:app`, with `/api/health` as the health check. Render's free plan has no persistent disk, so the SQLite database and uploaded evidence are lost whenever the service restarts. Use a paid disk, or another host, for real data.

The frontend builds with `npm run build` and is served by Vercel (`vercel.json` rewrites every path to `index.html`). Set `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` there.

On the backend set at least `JWT_SECRET_KEY`, `ALLOWED_ORIGINS`, `GOOGLE_CLIENT_ID`, `FRONTEND_URL`, `BACKEND_URL`, the SMTP settings, and the AdvantaSMS key. Leave `DEBUG` off.

## Security notes

- **Demo sign-in.** `DEBUG` must stay off in production: with it on, anyone can sign in as any UoN address.
- **CORS.** Only addresses in `ALLOWED_ORIGINS` can call the API from a browser with the sign-in cookies.
- **Data kept out of git.** Databases and uploaded evidence are ignored by git, because they hold students' details and documents. Copies committed before this change remain in the repository's history.
- **Demo accounts in production.** The startup demo data also creates administrator accounts on a production database: `admin@studentsaffairs.com`, the project owner's address, and the demo administrator. Their stored passwords aren't used by any sign-in route, but the accounts exist. Remove them, or the seeding, if you don't want them.
- **Evidence files** are served to anyone who has the file's link. The names are random, but there's no sign-in check.
- **Secrets that used to be in the code.** The AdvantaSMS key was hardcoded in `routers/auth.py` before it moved to settings, and `webhook.py` still contains its deploy secret. Both are public in the repository's history: rotate them.

## Known limitations

- **Phone sign-in doesn't send codes.** `_send_otp_sms` imports `app.routers.admin`, which was moved to `routers/archive/`, so the import fails and no text is sent.
- **Every lecturer sees every claim.** Lecturers can change the status of any claim, not just those that name them, and anyone with an `@uonbi.ac.ke` Google account counts as a lecturer.
- **TypeScript errors.** `npm run lint` reports errors: `LecturerPortalView.tsx` uses `submittingReview`, which isn't defined, and a test's props are out of date.
- **Wrong upload message.** The upload size error says 10 MB, but the limit is 3 MB.
- **Ticket IDs.** IDs come from a count of existing claims, so two claims filed at the same moment could get the same ID.

## Screenshots

`python scripts/docs_screenshots.py` regenerates `docs/screenshots/`. Run it with a Python that has the backend's packages, after `npm install` and `pip install websocket-client`. It needs Chrome or Chromium, and ports 8000 and 3000 free. It:

1. starts the backend in development mode on a temporary database, from a temporary folder so `backend/.env` isn't read, with email, SMS and payment settings blanked
2. starts Vite
3. signs in as the demo accounts
4. photographs the pages in headless Chrome

The repository has no license file; all rights are reserved.
