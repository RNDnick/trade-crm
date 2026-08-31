import { getState, getContact, update } from "./store.js";
import { icon, currency, formatDate, contactQuickActions, statusChip, emptyState } from "./components.js";
import { JOB_STATUSES } from "./data.js";

export const meta = { title: "Jobs" };

const JOB_TONE = { scheduled: "blue", in_progress: "amber", complete: "purple", invoiced: "neutral", paid: "green" };

let activeFilter = "active";

function statusIndex(id) {
  return JOB_STATUSES.findIndex((s) => s.id === id);
}

function nextStatus(id) {
  const idx = statusIndex(id);
  return idx >= 0 && idx < JOB_STATUSES.length - 1 ? JOB_STATUSES[idx + 1] : null;
}

function advanceJob(id) {
  update((s) => {
    const job = s.jobs.find((j) => j.id === id);
    if (!job) return;
    const next = nextStatus(job.status);
    if (next) job.status = next.id;
  });
}

function jobCardHtml(job) {
  const contact = getContact(job.contactId);
  const idx = statusIndex(job.status);
  const pct = ((idx + 1) / JOB_STATUSES.length) * 100;
  const next = nextStatus(job.status);
  return `
    <div class="card" data-job-id="${job.id}">
      <div class="job-card-top">
        <div>
          <div class="job-title">${job.title}</div>
          <a href="#/contacts/${contact.id}" class="lead-name">${contact.name}</a>
        </div>
        <div class="lead-value">${currency(job.value)}</div>
      </div>
      <div class="lead-meta-row">
        ${statusChip(JOB_STATUSES[idx].label, JOB_TONE[job.status])}
        <span class="lead-age">${formatDate(job.scheduledDate)}</span>
      </div>
      <div class="job-progress"><div class="job-progress-bar" style="width:${pct}%"></div></div>
      <div class="lead-meta-row" style="margin-top:14px">
        ${contactQuickActions(contact, { compact: true })}
        ${next ? `<button class="btn btn-tonal btn-sm" data-advance>${icon("arrow_forward")} ${next.label}</button>` : ""}
      </div>
    </div>`;
}

export function render(container) {
  const { jobs } = getState();
  const active = jobs.filter((j) => j.status !== "paid");
  const done = jobs.filter((j) => j.status === "paid");

  container.innerHTML = `
    <div class="section-row" style="margin-top:0">
      <div class="section-title" style="margin:0">Jobs</div>
      <span style="font-size:13px;color:var(--on-surface-variant)">${jobs.length} total</span>
    </div>
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
