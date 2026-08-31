import { getState, getContact, update } from "./store.js";
import { icon, formatTime, contactQuickActions, emptyState, toast } from "./components.js";

export const meta = { title: "Calendar" };

let selectedDate = startOfDay(new Date());
let weekStart = startOfWeek(new Date());

function startOfDay(d) {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}
function startOfWeek(d) {
  const n = startOfDay(d);
  const day = (n.getDay() + 6) % 7; // Monday = 0
  n.setDate(n.getDate() - day);
  return n;
}
function addDays(d, n) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
function sameDay(a, b) {
  return a.toDateString() === b.toDateString();
}
function apptTypeIcon(type) {
  return { quote: "request_quote", job: "construction", callback: "call", other: "event" }[type] || "event";
}
function apptTypeTone(type) {
  return { quote: "chip-amber", job: "chip-blue", callback: "chip-purple", other: "chip-neutral" }[type] || "chip-neutral";
}

function apptsOn(date) {
  return getState()
    .appointments.filter((a) => sameDay(new Date(a.date), date))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function connectBanner(settings) {
  if (settings.calendarConnections.google || settings.calendarConnections.outlook) return "";
  return `
    <div class="calendar-connect-banner">
      ${icon("sync")}
      <div class="calendar-connect-banner-text">
        <b>Sync your calendar</b>
        Connect Google or Outlook so appointments booked here show up on your phone automatically.
      </div>
    </div>
    <div style="display:flex;gap:8px;margin:-10px 0 16px">
      <button class="btn btn-outlined btn-sm" id="connect-google" style="flex:1">${icon("event", "")} Connect Google</button>
      <button class="btn btn-outlined btn-sm" id="connect-outlook" style="flex:1">${icon("event", "")} Connect Outlook</button>
    </div>`;
}

function wireConnectButtons(container) {
  const wire = (id, key, label) => {
    const btn = container.querySelector(`#${id}`);
    if (!btn) return;
    btn.addEventListener("click", () => {
      btn.disabled = true;
      btn.textContent = "Connecting…";
      setTimeout(() => {
        update((s) => (s.settings.calendarConnections[key] = true));
        toast(`${label} connected`);
      }, 900);
    });
  };
  wire("connect-google", "google", "Google Calendar");
  wire("connect-outlook", "outlook", "Outlook Calendar");
}

function agendaRowHtml(a) {
  const c = getContact(a.contactId);
  return `
    <div class="appt-row">
      <div class="appt-time">${formatTime(a.date)}</div>
      <div class="appt-body">
        <a href="#/contacts/${c.id}" style="display:block">
          <div class="appt-title">${a.title}</div>
          <div class="appt-meta">
            <span class="chip ${apptTypeTone(a.type)}">${icon(apptTypeIcon(a.type))}</span>
            ${c.name}${a.location ? ` &middot; ${a.location}` : ""}
          </div>
        </a>
      </div>
      ${contactQuickActions(c, { compact: true })}
    </div>`;
}

function renderMobile(container, settings) {
  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i - 3));
  container.innerHTML = `
    ${connectBanner(settings)}
    <div class="date-scroller">
      ${days
        .map((d) => {
          const isToday = sameDay(d, new Date());
          const isActive = sameDay(d, selectedDate);
          const hasEvents = apptsOn(d).length > 0;
          return `
          <button class="date-chip ${isToday ? "today" : ""} ${isActive ? "active" : ""} ${hasEvents ? "has-events" : ""}" data-date="${d.toISOString()}">
            <div class="dow">${d.toLocaleDateString("en-GB", { weekday: "short" })}</div>
            <div class="dom">${d.getDate()}</div>
            <div class="dot"></div>
          </button>`;
        })
        .join("")}
    </div>
    <div class="section-title" id="agenda-title" style="margin-top:16px"></div>
    <div class="card" id="agenda-list"></div>
  `;

  wireConnectButtons(container);

  function paintAgenda() {
    container.querySelector("#agenda-title").textContent = selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    const items = apptsOn(selectedDate);
    container.querySelector("#agenda-list").innerHTML = items.length
      ? items.map(agendaRowHtml).join("")
      : emptyState("event_available", "Nothing scheduled", "Add an appointment with the + button.");
    container.querySelectorAll(".date-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.date === selectedDate.toISOString()));
  }
  paintAgenda();

  container.querySelectorAll(".date-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      selectedDate = new Date(chip.dataset.date);
      paintAgenda();
    });
  });
}

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 19;

function renderDesktop(container, settings) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
  const weekLabel = `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(weekStart, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

  container.innerHTML = `
    ${connectBanner(settings)}
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <button class="btn btn-outlined btn-sm" id="week-today">Today</button>
      <button class="topbar-icon-btn" id="week-prev">${icon("chevron_left")}</button>
      <button class="topbar-icon-btn" id="week-next">${icon("chevron_right")}</button>
      <div style="font-size:15px;font-weight:500">${weekLabel}</div>
    </div>
    <div class="week-grid">
      <div class="week-time-col">
        <div class="week-day-header"></div>
        ${hours.map((h) => `<div class="week-hour-label">${h}:00</div>`).join("")}
      </div>
      ${days
        .map((d) => {
          const isToday = sameDay(d, new Date());
          return `
          <div>
            <div class="week-day-header ${isToday ? "today" : ""}">
              <div>${d.toLocaleDateString("en-GB", { weekday: "short" })}</div>
              <div class="dom">${d.getDate()}</div>
            </div>
            <div class="week-day-col" data-date="${d.toISOString()}" style="height:${hours.length * 56}px">
              ${hours.map(() => `<div class="week-hour-cell"></div>`).join("")}
              ${apptsOn(d)
                .map((a) => {
                  const start = new Date(a.date);
                  const startMins = (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes();
                  const top = Math.max(0, (startMins / 60) * 56);
                  const height = Math.max(24, (a.duration / 60) * 56 - 2);
                  const c = getContact(a.contactId);
                  return `<a class="week-event" href="#/contacts/${c.id}" style="top:${top}px;height:${height}px" title="${a.title}"><b>${formatTime(a.date)}</b>${a.title}</a>`;
                })
                .join("")}
            </div>
          </div>`;
        })
        .join("")}
    </div>
  `;

  wireConnectButtons(container);
  container.querySelector("#week-today").addEventListener("click", () => {
    weekStart = startOfWeek(new Date());
    renderDesktop(container, settings);
  });
  container.querySelector("#week-prev").addEventListener("click", () => {
    weekStart = addDays(weekStart, -7);
    renderDesktop(container, settings);
  });
  container.querySelector("#week-next").addEventListener("click", () => {
    weekStart = addDays(weekStart, 7);
    renderDesktop(container, settings);
  });
}

export function render(container) {
  const { settings } = getState();
  container.innerHTML = `<div class="mobile-only" id="cal-mobile"></div><div class="desktop-only" id="cal-desktop"></div>`;
  renderMobile(container.querySelector("#cal-mobile"), settings);
  renderDesktop(container.querySelector("#cal-desktop"), settings);
}
