import { getState, getContact, upcomingAppointments } from "./store.js";
import { icon, currency, formatTime, relativeDay, contactQuickActions, emptyState } from "./components.js";
import { APP_VERSION } from "./version.js";

export const meta = { title: "Home" };

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function apptTypeIcon(type) {
  return { quote: "request_quote", job: "construction", callback: "call", other: "event" }[type] || "event";
}

const TONE_VARS = {
  blue: ["--primary-container", "--on-primary-container"],
  amber: ["--warning-container", "--warning"],
  purple: ["--purple-container", "--purple"],
  green: ["--success-container", "--success"],
};

function statCard(iconName, tone, value, label) {
  const [bg, fg] = TONE_VARS[tone];
  return `
    <div class="stat-card">
      <div class="stat-icon" style="background:var(${bg});color:var(${fg})">${icon(iconName)}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
}

export function render(container) {
  const { settings, leads, jobs } = getState();
  const now = new Date();
  const all = upcomingAppointments();
  const todays = all.filter((a) => isSameDay(new Date(a.date), now));
  const nextUp = all.filter((a) => !isSameDay(new Date(a.date), now)).slice(0, 4);

  const newLeads = leads.filter((l) => l.stage === "new").length;
  const inProgress = jobs.filter((j) => j.status === "in_progress").length;
  const awaitingQuote = leads.filter((l) => l.stage === "quoted").length;
  const paidThisMonth = jobs
    .filter((j) => j.status === "paid" && new Date(j.scheduledDate).getMonth() === now.getMonth() && new Date(j.scheduledDate).getFullYear() === now.getFullYear())
    .reduce((sum, j) => sum + j.value, 0);

  container.innerHTML = `
    <div class="greeting">${greetingWord()}, ${settings.ownerName.split(" ")[0]}</div>
    <div class="greeting-sub">${settings.businessName} &middot; ${todays.length} appointment${todays.length === 1 ? "" : "s"} today</div>

    <div class="stat-grid">
      ${statCard("person_add", "blue", newLeads, "New leads")}
      ${statCard("construction", "amber", inProgress, "Jobs in progress")}
      ${statCard("request_quote", "purple", awaitingQuote, "Quotes awaiting reply")}
      ${statCard("payments", "green", currency(paidThisMonth), "Paid this month")}
    </div>

    <div class="section-row">
      <div class="section-title">Today's schedule</div>
      <a class="btn-text" href="#/calendar" style="font-size:13px">View calendar</a>
    </div>
    <div class="card" id="today-card"></div>

    ${nextUp.length ? `<div class="section-title">Coming up</div><div class="card" id="nextup-card"></div>` : ""}

    <p class="version-tag">TradeFlow v${APP_VERSION}</p>
  `;

  const todayCard = container.querySelector("#today-card");
  if (!todays.length) {
    todayCard.innerHTML = emptyState("event_available", "Nothing scheduled today", "Enjoy the quiet — or add a job from the + button.");
  } else {
    todayCard.innerHTML = todays
      .map((a) => {
        const c = getContact(a.contactId);
        return `
        <div class="appt-row">
          <div class="appt-time">${formatTime(a.date)}</div>
          <div class="appt-body">
            <a href="#/contacts/${c.id}" style="display:block">
              <div class="appt-title">${a.title}</div>
              <div class="appt-meta">${icon(apptTypeIcon(a.type))} ${c.name}${a.location ? ` &middot; ${a.location}` : ""}</div>
            </a>
          </div>
          ${contactQuickActions(c, { compact: true })}
        </div>`;
      })
      .join("");
  }

  if (nextUp.length) {
    container.querySelector("#nextup-card").innerHTML = nextUp
      .map((a) => {
        const c = getContact(a.contactId);
        return `
        <a class="appt-row" href="#/contacts/${c.id}" style="display:flex">
          <div class="appt-time">${relativeDay(a.date)}<br/><span style="opacity:.75">${formatTime(a.date)}</span></div>
          <div class="appt-body">
            <div class="appt-title">${a.title}</div>
            <div class="appt-meta">${icon(apptTypeIcon(a.type))} ${c.name}</div>
          </div>
        </a>`;
      })
      .join("");
  }
}
