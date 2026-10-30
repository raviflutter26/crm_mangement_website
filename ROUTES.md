# RIVO website routes

One codebase, two static sites:

| Surface | Who | Build | Output | Local |
|---|---|---|---|---|
| **tenant** (company app) | owner, admin, HR, manager, employee | `npm run build` | `out/` | `npm run dev` → :3000, `npm start` |
| **console** (RIVO platform console) | RIVO team (role `superadmin`) | `npm run build:console` | `out-console/` | `npm run dev:console` → :3100, `npm run start:console` |

## How the two builds are separated

`next.config.ts` reads `NEXT_PUBLIC_APP_SURFACE`:

- `tenant` (default): normal `pageExtensions`. Route files are `page.tsx`, `layout.tsx`, … Files named `*.console.tsx` are not route files in this build, so no console page exists in `out/`.
- `console`: `pageExtensions: ['console.tsx', 'console.ts']` and `distDir: 'out-console'`. Only `page.console.tsx` / `layout.console.tsx` are route files, so no company page exists in `out-console/`. With `output: 'export'`, `distDir` names the export folder; the build itself still runs in `.next/`, so run the two builds one after the other.

Docs used (`node_modules/next/dist/docs/01-app`): `03-api-reference/05-config/01-next-config-js/pageExtensions.md`, `distDir.md`, `02-guides/static-exports.md` (no server redirects/rewrites; dynamic routes need `generateStaticParams` with `dynamicParams = false`), `03-api-reference/03-file-conventions/route-groups.md`.

Layout of `src/app`:

```
layout.tsx               tenant root layout     layout.console.tsx     console root layout
page.tsx                 / → /dashboard|/login  page.console.tsx       same, console
(auth)/                  login, setup-password, sso-complete, wrong-app            (tenant)
(dashboard)/layout.tsx   tenant shell: Sidebar + Topbar + RouteGuard
(dashboard)/**/page.tsx  every company page
(legacy)/**              redirect pages for old URLs (tenant)
(console-public)/        login, setup-password, mfa-setup, wrong-app               (console)
(console)/layout.console.tsx  console shell: ConsoleSidebar + Topbar + ConsoleGuard
(console)/**/page.console.tsx every console page
```

### Environment variables

| Variable | Meaning | Default |
|---|---|---|
| `NEXT_PUBLIC_APP_SURFACE` | `tenant` or `console`; picks the build and is inlined into it | `tenant` |
| `NEXT_PUBLIC_APP_URL` | Company app base URL. The console links here (wrong-app message, "log in as organization") | `http://localhost:3000` |
| `NEXT_PUBLIC_CONSOLE_URL` | Console base URL. The company app points the RIVO team here | `http://localhost:3100` |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL (unchanged) | `http://localhost:5001` |

The console build sends `X-RIVO-Surface: console` on every API call (`surfaceHeaders()` in `src/lib/surface.ts`, spread into the axios defaults in `src/lib/axios.ts`). The API keys the session cookie on it: `rivo_console` for the console, `rivo_session` for the company app.

## Access control

- **Company app.** `src/config/routes.ts` is the single route registry: path, label, icon, allowed roles (`owner` implies `admin`), backend module key and menu group. The Sidebar is generated from it. It still applies the company's stored module grants (`GET /api/role-permissions`) for admin/HR, as before. `RouteGuard` (in `(dashboard)/layout.tsx`) uses the same check on every page: an unregistered path, or one the role may not use, shows a 403/404 screen with a link to `/dashboard`. A sub-path inherits its longest registered prefix (e.g. `/exits/letter` → `/exits`). `/dashboard`, `/help` and `/me/*` are open to every company role. Any other role (the RIVO team) is sent to `/wrong-app`, which links to `NEXT_PUBLIC_CONSOLE_URL`.
- **Console.** `src/config/consoleRoutes.ts` drives the console sidebar. `ConsoleGuard` admits only `superadmin`; company users go to `/wrong-app`, which links to `NEXT_PUBLIC_APP_URL`. MFA is mandatory: a superadmin without MFA is sent to `/mfa-setup` and nothing else is reachable until a code is verified. The API enforces the same rule (`requireSuperadminMfa` → 403 `MFA_SETUP_REQUIRED`).
- After sign-in, `dashboardPathFor()` sends everyone to `/dashboard`, or to `/wrong-app` on the wrong surface.

## Company app URLs (tenant)

| URL | Roles | Screen |
|---|---|---|
| `/dashboard` | all | Role-aware. owner and group-wide admins: company overview across branches (+ Operations tab). admin/HR: organization overview. manager: team overview. employee: my dashboard |
| `/analytics` | admin | Analytics |
| `/reports` | admin, HR | Reports |
| `/branches` | admin | Organization structure and branches |
| `/departments` | admin, HR | Departments |
| `/employees`, `/employees/details?id=`, `/employees/statutory?id=` | admin, HR, manager | Employees (`?edit=<id>` opens the edit form) |
| `/locations` | admin, HR | Sites & locations |
| `/projects` | admin, manager | Projects |
| `/vendors` | admin | Vendors |
| `/recruitment` | admin, HR | Recruitment |
| `/attendance` | admin, HR, manager | Attendance |
| `/attendance/settings` | admin | Attendance rules |
| `/leaves` | admin, HR, manager | Leave management |
| `/leaves/policy` | admin | Leave policy |
| `/permissions` | admin, HR, manager | Permission (short leave) requests |
| `/permissions/policy` | admin | Permission policy |
| `/shifts` | admin, HR | Shifts & roster |
| `/performance` | admin, HR, manager | Performance |
| `/training` | admin, HR | Training |
| `/exits`, `/exits/letter` | admin, HR, manager | Exits & F&F |
| `/transfers` | admin, HR | Transfers |
| `/field-tracking`, `/job-cards`, `/travel`, `/inventory` | admin, manager | Field operations |
| `/timesheets` | admin, HR, manager | Timesheets |
| `/safety-inductions`, `/compliance` | admin, HR | Safety, compliance & licences |
| `/incidents` | admin, HR, manager | Incidents |
| `/ppe-records` | admin, manager | PPE records |
| `/compliance/logs` | admin | Compliance & logs |
| `/payroll` | admin, HR | Payroll overview |
| `/payroll/runs`, `/payroll/employees`, `/payroll/attendance`, `/payroll/payouts`, `/payroll/loans`, `/payroll/reports`, `/payroll/audit` | admin, HR | Payroll module |
| `/statutory`, `/salary/components`, `/salary/settings` | admin, HR | Statutory and salary setup |
| `/reimbursements`, `/expenses` | admin, HR, manager | Claims |
| `/allowances` | admin, manager | Site allowances |
| `/revenue` | admin | Project financials |
| `/roles`, `/authentication`, `/ip-allowlist` | admin | Access control |
| `/assets` | admin, HR | Assets |
| `/location-tracking` | admin | Location tracking |
| `/email-settings`, `/support-tickets`, `/settings` | admin | Settings |
| `/announcements` | admin, HR | Announcements |
| `/billing` | owner, admin | Subscription & invoices |
| `/help` | all | Help |
| `/me` | all | Self-service hub |
| `/me/profile`, `/me/check-in`, `/me/attendance`, `/me/site-attendance`, `/me/job-cards`, `/me/shift-schedule`, `/me/timesheets`, `/me/leaves`, `/me/travel`, `/me/reimbursements`, `/me/payslips`, `/me/allowances`, `/me/esi-pf`, `/me/tax`, `/me/safety`, `/me/incidents`, `/me/ppe`, `/me/training`, `/me/certifications`, `/me/skills`, `/me/targets`, `/me/appraisals`, `/me/announcements`, `/me/documents`, `/me/assets`, `/me/team`, `/me/resignation`, `/me/resignation/letter`, `/me/settings` | all | Own self-service. Staff see these under "My Workspace" in the sidebar |
| `/login`, `/setup-password`, `/sso-complete`, `/wrong-app` | public | Sign-in flow |

"admin" always includes owner. The sidebar and guard can be narrowed or widened per company with stored module grants (backend `ModulePermission`).

## Console URLs

`/login` (includes "Forgot Password?"), `/setup-password?token=`, `/mfa-setup`, `/wrong-app`, `/dashboard`, `/analytics`, `/demo-requests`, `/organizations`, `/organizations/add`, `/organizations/pending`, `/organizations/suspended`, `/organizations/view?id=`, `/organizations/edit?id=`, `/users`, `/users/invitations`, `/users/locked`, `/infra` (system health), `/infra/server`, `/infra/database`, `/infra/gateway`, `/billing/subscriptions`, `/billing/revenue`, `/seats`, `/audit-log`, `/security` (→ `/security/sso`), `/security/sso`, `/security/mfa`, `/security/sessions`, `/security/ip-allowlist`, `/support`, `/settings`, `/settings/config`, `/settings/email`, `/settings/features`.

### Setting a password (invitations and resets)

Both surfaces have `/setup-password?token=…` (one component, `src/components/auth/SetupPassword.tsx`). It checks the link with `GET /api/auth/reset-password/:token` (shows the account's email, or "invalid or expired") and sets the password with `PUT /api/auth/reset-password/:token`. "Forgot Password?" on either login page calls `POST /api/auth/forgot-password`.

The API always emails `${WEBSITE_URL}/setup-password?token=…`, i.e. the company app, including for RIVO team (superadmin) invitations and resets. After a successful PUT the page reads `data.user.role` from the response:

- role allowed on this surface (or no user returned: MFA or SSO accounts): go to this surface's `/login?notice=password-set`;
- role belongs to the other surface (a superadmin on the company app, or a company user on the console): sign out the session the PUT just opened here (`POST /api/auth/logout`) and go to the other surface's `/login/?notice=password-set` (`NEXT_PUBLIC_CONSOLE_URL`, or `NEXT_PUBLIC_APP_URL` from the console).

`/login?notice=password-set` shows "Your password is set" (on the console: "RIVO team accounts sign in here, on the RIVO console"). A new superadmin then signs in on the console and is taken to `/mfa-setup`.

"Log in as organization" opens the company app at `NEXT_PUBLIC_APP_URL/dashboard/`. The API sets the company-app session cookie.

## Old URLs (tenant build)

Static export has no server redirects. Each old URL is pre-rendered as a small page under `src/app/(legacy)` that replaces itself with the new URL and keeps the query string and hash. The mapping is in `src/config/legacyRoutes.ts`. An old URL not in the table falls back to that prefix's root.

| Old | New |
|---|---|
| `/admin`, `/admin/dashboard`, `/hr`, `/hr/dashboard`, `/manager`, `/manager/dashboard`, `/employee`, `/employee/dashboard` | `/dashboard` |
| `/admin/analytics` | `/analytics` |
| `/admin/statutory`, `/hr/statutory` | `/statutory` |
| `/hr/{employees,attendance,leaves,recruitment}`, `/manager/{employees,attendance,leaves,projects}` | `/{same}` |
| `/admin/dashboard/payroll`, `/payroll-module` | `/payroll` |
| `/admin/dashboard/payroll/payroll-runs`, `/payroll-module/payroll-runs` | `/payroll/runs` |
| `/admin/dashboard/payroll/{employees,attendance,payouts,loans,reports,audit}`, `/payroll-module/{same}` | `/payroll/{same}` |
| `/employee/allowance` | `/me/allowances` |
| `/employee/incident` | `/me/incidents` |
| `/employee/job-card` | `/me/job-cards` |
| `/employee/reimbursement` | `/me/reimbursements` |
| `/employee/travel-request` | `/me/travel` |
| `/employee/<x>` (all other self-service pages, incl. `resignation/letter`) | `/me/<x>` |
| `/attendance-settings` | `/attendance/settings` |
| `/leave-settings` | `/leaves/policy` |
| `/permission-settings` | `/permissions/policy` |
| `/salary-components`, `/salary-settings` | `/salary/components`, `/salary/settings` |
| `/compliance-logs` | `/compliance/logs` |
| `/payroll-reports` | `/payroll/reports` |
| `/organization`, `/organizations` | `/branches` |
| `/self-service` | `/me` |
| `/superadmin`, `/superadmin/*` | One catch-all notice: "the RIVO console has moved", linking to the same screen on `NEXT_PUBLIC_CONSOLE_URL` |

Removed: `/employees/[id]/statutory` (in a static export it only worked for the placeholder id; use `/employees/statutory?id=`), `/superadmin/leaves` and `/superadmin/locations` (tenant screens with no data for the platform team), and the duplicate payroll pages (`/admin/dashboard/payroll/*` vs `/payroll-module/*`, now one set under `/payroll`).

Notification links written by the API now use the new URLs (`/me/attendance`, `/me/leaves`). Older notifications still work through the redirects.
