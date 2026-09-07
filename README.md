# TradeFlow

A mobile-first CRM prototype for sole traders and small trade businesses —
electricians, plumbers, builders. Capture leads, move them through a pipeline,
book appointments, and call/email/text clients straight from their default
phone apps.

This is a **static, front-end-only prototype**: everything runs in the
browser and data is stored in `localStorage`, so it resets if you clear site
data or open it on a different device/browser. There's no backend, no
accounts, and no real calendar sync yet — see "What's mocked" below.

## Features

- **Dashboard** — today's appointments, plus at-a-glance stats: new leads,
  jobs in progress, quotes awaiting a reply, and revenue paid this month.
- **Pipeline** — leads move through New → Contacted → Quote Sent →
  Won/Lost. Stage tabs and a card list on mobile; a full drag-and-drop
  Kanban board on desktop. A won lead converts to a job in one tap.
- **Contacts** — a searchable client list. Each contact's page has one-tap
  **Call**, **Email**, **Text**, and **Directions** buttons that hand off to
  your phone's own dialer, mail app, messages, and Google Maps, plus their
  job/lead history and notes.
- **Calendar** — a day agenda with a date scroller on mobile, a full week
  grid on desktop. Includes a "Connect Google/Outlook Calendar" banner.
- **Jobs** — Scheduled → In Progress → Complete → Invoiced → Paid, with a
  progress bar and one-tap status advance. Each job opens into a **Job
  detail** page with:
  - a **task checklist**, so a job can be broken into steps with a progress
    bar, plus a separate **punch list** for snags to clear before sign-off;
  - **crew assignment** — tasks can be assigned to a team member set up in
    Settings;
  - a **budget** panel — quoted value vs. materials cost and labour hours
    (at your set hourly rate), with the resulting profit and margin;
  - a **photo log** — add photos straight from your phone's camera or
    gallery, stored on-device.
  - A **List/Timeline** toggle on the Jobs tab shows every job across the
    week as a Gantt-style strip on desktop, or a day-by-day agenda on
    mobile — either way flagging a day with more than one job booked, so a
    double-booking is visible before it becomes a problem.
- **Settings** — business profile, hourly rate and crew, calendar connection
  toggles, light/dark/system theme, and a reset-to-demo-data button.
- A **+** button on every screen to quickly add a lead, job, or appointment,
  including creating a new client inline.

Design follows Material 3, styled to match Google's own apps (Gmail/Calendar
blue, Roboto, Material Symbols icons), with a bottom nav bar on mobile that
becomes a left nav rail past 900px wide.

## What's mocked

- **Calendar sync** — the Google/Outlook "Connect" buttons flip a switch in
  local state; there's no real OAuth or event sync yet.
- **Data** — seeded with fictional demo contacts/leads/jobs on first load,
  stored only in that browser's `localStorage`. No backend, no multi-device
  sync, no real authentication.
- **Photos** — stored as-is in `localStorage`, which most browsers cap at a
  few MB per site. Fine for a handful of demo photos; a real build would
  need proper file storage (and probably client-side compression) before
  relying on it for a full job's worth of photos.

## Running it locally

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

Then open `http://localhost:8936`.

## Using it on your phone

This is plain HTML/CSS/JS with no build step, so it's hosted directly on
GitHub Pages — open the Pages URL on your phone and use "Add to Home
Screen" for an app-like icon.
