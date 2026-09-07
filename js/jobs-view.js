import { getState, getContact, advanceJob, jobStatusIndex, nextJobStatus, taskProgress, jobEndDate } from "./store.js";
import { icon, avatar, currency, formatDate, contactQuickActions, statusChip, emptyState } from "./components.js";
import { JOB_STATUSES } from "./data.js";

export const meta = { title: "Jobs" };

const JOB_TONE = { scheduled: "blue", in_progress: "amber", complete: "purple", invoiced: "neutral", paid: "green" };
const TONE_VARS = {
  blue: ["--primary-container", "--on-primary-container", "--primary"],
  amber: ["--warning-container", "--warning", "--warning"],
  purple: ["--purple-container", "--purple", "--purple"],
  green: ["--success-container", "--success", "--success"],
  neutral: ["--surface-variant", "--on-surface-variant", "--on-surface-variant"],
};

let activeFilter = "active";
let activeView = "list";
let weekStart = startOfWeek(new Date());

function startOfDay(d) {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}
function startOfWeek(d) {
  const n = startOfDay(d);
  const day = (n.getDay() + 6) % 7;
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
function jobsOnDay(jobs, day) {
  return jobs.filter((j) => {
    const s = startOfDay(new Date(j.scheduledDate));
    const e = startOfDay(jobEndDate(j));
    return day >= s && day <= e;
  });
}
function weekSpan(job, weekDays) {
  const weekStartDay = weekDays[0];
  const weekEndDay = weekDays[6];
  const jobStart = startOfDay(new Date(job.scheduledDate));
  const jobEnd = startOfDay(jobEndDate(job));
  if (jobEnd < weekStartDay || jobStart > weekEndDay) return null;
  const clippedStart = jobStart < weekStartDay ? weekStartDay : jobStart;
  const clippedEnd = jobEnd > weekEndDay ? weekEndDay : jobEnd;
  const startCol = Math.round((clippedStart - weekStartDay) / 86400000) + 1;
  const span = Math.round((clippedEnd - clippedStart) / 86400000) + 1;
  return { startCol, span };
}

function jobCardHtml(job) {
  const contact = getContact(job.contactId);
  const idx = jobStatusIndex(job.status);
  const pct = ((idx + 1) / JOB_STATUSES.length) * 100;
  const next = nextJobStatus(job.status);
  const progress = taskProgress(job.id);
  return `
    <div class="card" data-job-id="${job.id}">
      <div class="job-card-top">
        <div>
          <a href="#/jobs/${job.id}" class="job-title" style="display:block">${job.title}</a>
          <a href="#/contacts/${contact.id}" class="lead-name">${contact.name}</a>
        </div>
        <div class="lead-value">${currency(job.value)}</div>
      </div>
      <div class="lead-meta-row">
        <span style="display:flex;gap:6px;align-items:center">
          ${statusChip(JOB_STATUSES[idx].label, JOB_TONE[job.status])}
          ${progress.total ? statusChip(`${progress.done}/${progress.total} tasks`, "neutral") : ""}
        </span>
        <span class="lead-age">${formatDate(job.scheduledDate)}</span>
      </div>
      <div class="job-progress"><div class="job-progress-bar" style="width:${pct}%"></div></div>
      <div class="lead-meta-row" style="margin-top:14px">
        ${contactQuickActions(contact, { compact: true })}
        ${next ? `<button class="btn btn-tonal btn-sm" data-advance>${icon("arrow_forward")} ${next.label}</button>` : ""}
      </div>
    </div>`;
}

function renderList(container) {
  const { jobs } = getState();
  const active = jobs.filter((j) => j.status !== "paid");
  const done = jobs.filter((j) => j.status === "paid");

  container.innerHTML = `
    <div class="segmented" style="margin-bottom:16px;max-width:280px">
      <button data-filter="active" class="${activeFilter === "active" ? "active" : ""}">Active (${active.length})</button>
      <button data-filter="all" class="${activeFilter === "all" ? "active" : ""}">All (${jobs.length})</button>
      <button data-filter="paid" class="${activeFilter === "paid" ? "active" : ""}">Paid (${done.length})</button>
    </div>
    <div id="jobs-list"></div>
  `;

  function paint() {
    const list =
      activeFilter === "active" ? active : activeFilter === "paid" ? done : jobs.slice().sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
    const listEl = container.querySelector("#jobs-list");
    listEl.innerHTML = list.length ? list.map(jobCardHtml).join("") : emptyState("construction", "No jobs here", "Add one with the + button, or convert a won lead from the Pipeline.");
    listEl.querySelectorAll("[data-advance]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const card = btn.closest("[data-job-id]");
        advanceJob(card.dataset.jobId);
      });
    });
  }
  paint();

  container.querySelectorAll(".segmented button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      container.querySelectorAll(".segmented button").forEach((b) => b.classList.toggle("active", b === btn));
      paint();
    });
  });
}

function ganttBarHtml(job, span) {
  const tone = JOB_TONE[job.status];
  const [bg, fg] = TONE_VARS[tone];
  return `<a href="#/jobs/${job.id}" class="gantt-bar" style="grid-column:${span.startCol} / span ${span.span};background:var(${bg});color:var(${fg})" title="${job.title}">${job.title}</a>`;
}

function renderDesktopGantt(container, jobs, weekDays) {
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows = jobs.filter((j) => weekSpan(j, weekDays));
  container.innerHTML = `
    <div class="gantt-scroll">
      <div class="gantt">
        <div class="gantt-corner"></div>
        ${weekDays
          .map((d, i) => {
            const conflictCount = jobsOnDay(jobs, d).length;
            const isToday = sameDay(d, new Date());
            return `
            <div class="gantt-day-head ${isToday ? "today" : ""}">
              <div class="dow">${dayLabels[i]}</div>${d.getDate()}
              ${conflictCount > 1 ? `<div class="gantt-conflict">${icon("error")}${conflictCount} jobs</div>` : ""}
            </div>`;
          })
          .join("")}
        ${
          rows.length
            ? rows
                .map((job) => {
                  const contact = getContact(job.contactId);
                  const span = weekSpan(job, weekDays);
                  return `
                <div class="gantt-row-label">
                  ${avatar(contact.name, contact.id, "sm")}
                  <div class="gantt-row-label-text">
                    <div class="gantt-row-label-title">${job.title}</div>
                    <div class="gantt-row-label-sub">${contact.name}</div>
                  </div>
                </div>
                <div class="gantt-track">${ganttBarHtml(job, span)}</div>`;
                })
                .join("")
            : ""
        }
      </div>
    </div>
    ${!rows.length ? emptyState("view_timeline", "Nothing scheduled this week", "Jobs with a scheduled date will appear here.") : ""}
    <div class="legend">
      <span><i style="background:var(--primary-container)"></i>Scheduled</span>
      <span><i style="background:var(--warning-container)"></i>In progress</span>
      <span><i style="background:var(--purple-container)"></i>Complete</span>
      <span><i style="background:var(--surface-variant)"></i>Invoiced</span>
      <span><i style="background:var(--success-container)"></i>Paid</span>
    </div>
  `;
}

function renderMobileAgenda(container, jobs, weekDays) {
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  container.innerHTML = weekDays
    .map((d, i) => {
      const dayJobs = jobsOnDay(jobs, d);
      const isToday = sameDay(d, new Date());
      return `
      <div class="day-block">
        <div class="day-head">
          <span class="name ${isToday ? "today" : ""}">${dayLabels[i]} ${d.getDate()}${isToday ? " &middot; Today" : ""}</span>
          ${dayJobs.length > 1 ? `<span class="day-warn">${icon("error")}${dayJobs.length} jobs booked</span>` : ""}
        </div>
        ${
          dayJobs.length
            ? dayJobs
                .map((job) => {
                  const contact = getContact(job.contactId);
                  const tone = JOB_TONE[job.status];
                  const [, , stripe] = TONE_VARS[tone];
                  return `
                <a class="job-agenda-row" href="#/jobs/${job.id}">
                  <div class="stripe" style="background:var(${stripe})"></div>
                  <div style="flex:1;min-width:0">
                    <div class="job-agenda-title">${job.title}</div>
                    <div class="job-agenda-sub">${contact.name} &middot; ${JOB_STATUSES[jobStatusIndex(job.status)].label}</div>
                  </div>
                </a>`;
                })
                .join("")
            : `<div class="day-empty">Nothing scheduled</div>`
        }
      </div>`;
    })
    .join("");
}

function renderTimeline(container) {
  const { jobs } = getState();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} &ndash; ${addDays(weekStart, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:14px;flex-wrap:wrap">
      <button class="btn btn-outlined btn-sm" id="week-today">Today</button>
      <button class="topbar-icon-btn" id="week-prev">${icon("chevron_left")}</button>
      <button class="topbar-icon-btn" id="week-next">${icon("chevron_right")}</button>
      <div style="font-size:14px;font-weight:500">${weekLabel}</div>
    </div>
    <div class="desktop-only" id="gantt-holder"></div>
    <div class="mobile-only" id="agenda-holder"></div>
  `;

  renderDesktopGantt(container.querySelector("#gantt-holder"), jobs, weekDays);
  renderMobileAgenda(container.querySelector("#agenda-holder"), jobs, weekDays);

  container.querySelector("#week-today").addEventListener("click", () => {
    weekStart = startOfWeek(new Date());
    renderTimeline(container);
  });
  container.querySelector("#week-prev").addEventListener("click", () => {
    weekStart = addDays(weekStart, -7);
    renderTimeline(container);
  });
  container.querySelector("#week-next").addEventListener("click", () => {
    weekStart = addDays(weekStart, 7);
    renderTimeline(container);
  });
}

export function render(container) {
  container.innerHTML = `
    <div class="section-row" style="margin-top:0;flex-wrap:wrap;gap:10px">
      <div class="section-title" style="margin:0">Jobs</div>
      <div class="view-toggle">
        <span data-view="list" class="${activeView === "list" ? "active" : ""}">${icon("view_list")} List</span>
        <span data-view="timeline" class="${activeView === "timeline" ? "active" : ""}">${icon("view_timeline")} Timeline</span>
      </div>
    </div>
    <div id="jobs-body"></div>
  `;

  const body = container.querySelector("#jobs-body");
  if (activeView === "list") {
    renderList(body);
  } else {
    renderTimeline(body);
  }

  container.querySelectorAll("[data-view]").forEach((el) => {
    el.addEventListener("click", () => {
      activeView = el.dataset.view;
      render(container);
    });
  });
}
