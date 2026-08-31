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
  progress bar and one-tap status advance.
- **Settings** — business profile, calendar connection toggles, light/dark/
  system theme, and a reset-to-demo-data button.
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

## Running it locally

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

Then open `http://localhost:8936`.

## Using it on your phone

This is plain HTML/CSS/JS with no build step, so it's hosted directly on
GitHub Pages — open the Pages URL on your phone and use "Add to Home
Screen" for an app-like icon.
