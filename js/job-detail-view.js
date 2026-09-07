import {
  getState,
  getJob,
  getContact,
  update,
  advanceJob,
  jobStatusIndex,
  nextJobStatus,
  tasksForJob,
  taskProgress,
  addTask,
  toggleTask,
  deleteTask,
  getCrew,
  getCrewMember,
  photosForJob,
  addPhoto,
  deletePhoto,
  jobBudget,
} from "./store.js";
import { icon, currency, formatDate, contactQuickActions, statusChip, toast } from "./components.js";
import { JOB_STATUSES } from "./data.js";

export const meta = { title: "Job" };

const JOB_TONE = { scheduled: "blue", in_progress: "amber", complete: "purple", invoiced: "neutral", paid: "green" };

function assigneeLabel(assigneeId) {
  if (!assigneeId) return "Unassigned";
  const member = getCrewMember(assigneeId);
  return member ? member.name : "Unassigned";
}

function taskRowHtml(task) {
  return `
    <div class="task-row" data-task-id="${task.id}">
      <span class="material-symbols-outlined icon icon-fill task-check" style="color:${task.done ? "var(--success)" : "var(--outline)"}" data-toggle>${task.done ? "check_circle" : "radio_button_unchecked"}</span>
      <div style="flex:1;min-width:0">
        <div class="task-title ${task.done ? "done" : ""}">${task.title}</div>
        <div class="task-meta">${assigneeLabel(task.assigneeId)}</div>
      </div>
      <button class="task-delete" data-delete aria-label="Delete task">${icon("close")}</button>
    </div>`;
}

function crewOptionsHtml() {
  return `<option value="">Me</option>` + getCrew().map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
}

function renderTaskSection(container, jobId, type, sectionTitle, emptyHint) {
  const list = tasksForJob(jobId, type);
  container.innerHTML = `
    <div class="section-title" style="margin-top:0">${sectionTitle}</div>
    <div class="card">
      <div id="task-list-${type}">${list.length ? list.map(taskRowHtml).join("") : `<p style="font-size:13px;color:var(--on-surface-variant)">${emptyHint}</p>`}</div>
      <div class="add-task-row">
        <input type="text" id="new-task-${type}" placeholder="${type === "punch" ? "Add a snag to fix" : "Add a task"}" />
        <select id="new-task-assignee-${type}">${crewOptionsHtml()}</select>
        <button class="btn btn-tonal btn-sm" id="add-task-${type}">${icon("add")}</button>
      </div>
    </div>
  `;

  function wire() {
    container.querySelectorAll("[data-toggle]").forEach((el) => {
      el.addEventListener("click", () => toggleTask(el.closest("[data-task-id]").dataset.taskId));
    });
    container.querySelectorAll("[data-delete]").forEach((el) => {
      el.addEventListener("click", () => deleteTask(el.closest("[data-task-id]").dataset.taskId));
    });
  }
  wire();

  container.querySelector(`#add-task-${type}`).addEventListener("click", () => {
    const input = container.querySelector(`#new-task-${type}`);
    const select = container.querySelector(`#new-task-assignee-${type}`);
    const title = input.value.trim();
    if (!title) return toast("Enter a description first.");
    addTask(jobId, title, type, select.value || null);
  });
}

function photoThumbHtml(photo) {
  return `
    <div class="photo-thumb" data-photo-id="${photo.id}">
      <img src="${photo.dataUrl}" alt="Job photo" />
      <button class="photo-delete" data-delete-photo aria-label="Delete photo">${icon("close")}</button>
    </div>`;
}

function renderPhotoSection(container, jobId) {
  const photos = photosForJob(jobId);
  container.innerHTML = `
    <div class="section-title">Photos</div>
    <div class="photo-row" id="photo-row">
      ${photos.map(photoThumbHtml).join("")}
      <label class="photo-thumb add" for="photo-input">${icon("add_a_photo")}</label>
      <input type="file" accept="image/*" capture="environment" id="photo-input" style="display:none" />
    </div>
  `;

  container.querySelectorAll("[data-delete-photo]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      deletePhoto(btn.closest("[data-photo-id]").dataset.photoId);
    });
  });

  container.querySelector("#photo-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addPhoto(jobId, reader.result);
      toast("Photo added");
    };
    reader.readAsDataURL(file);
  });
}

function renderBudgetSection(container, job) {
  const b = jobBudget(job);
  container.innerHTML = `
    <div class="section-title">Budget</div>
    <div class="card">
      <div class="budget-row">
        <span style="color:var(--on-surface-variant)">Quoted value</span>
        <span style="font-weight:500">${currency(job.value)}</span>
      </div>
      <div class="budget-row">
        <span style="color:var(--on-surface-variant)">Materials (&pound;)</span>
        <input type="number" id="budget-materials" value="${job.materialsCost}" min="0" step="1" />
      </div>
      <div class="budget-row">
        <span style="color:var(--on-surface-variant)">Labour hours</span>
        <input type="number" id="budget-hours" value="${job.labourHours}" min="0" step="0.5" />
      </div>
      <div class="budget-row">
        <span style="color:var(--on-surface-variant)">Labour cost &middot; ${currency(getState().settings.hourlyRate)}/hr</span>
        <span>${currency(b.labourCost)}</span>
      </div>
      <div class="budget-row" style="align-items:center">
        <span style="font-weight:500">Estimated profit</span>
        <span class="chip ${b.profit >= 0 ? "chip-green" : "chip-red"}">${currency(b.profit)} &middot; ${b.marginPct}%</span>
      </div>
    </div>
  `;

  const save = () => {
    const materials = Number(container.querySelector("#budget-materials").value) || 0;
    const hours = Number(container.querySelector("#budget-hours").value) || 0;
    update((s) => {
      const j = s.jobs.find((x) => x.id === job.id);
      j.materialsCost = materials;
      j.labourHours = hours;
    });
  };
  container.querySelector("#budget-materials").addEventListener("change", save);
  container.querySelector("#budget-hours").addEventListener("change", save);
}

export function render(container, jobId) {
  const job = getJob(jobId);
  if (!job) {
    container.innerHTML = `<div class="card">Job not found. <a class="btn-text" href="#/jobs">Back to jobs</a></div>`;
    return;
  }
  const contact = getContact(job.contactId);
  const idx = jobStatusIndex(job.status);
  const next = nextJobStatus(job.status);
  const progress = taskProgress(job.id);
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  container.innerHTML = `
    <a href="#/jobs" class="btn-text" style="margin-bottom:8px;display:inline-flex;padding-left:0">${icon("arrow_back")} Jobs</a>

    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;gap:10px">
      <div>
        <div style="font-size:19px;font-weight:500">${job.title}</div>
        <a href="#/contacts/${contact.id}" class="lead-name">${contact.name} &middot; ${contact.address || contact.phone}</a>
      </div>
      <div style="font-size:17px;font-weight:500;white-space:nowrap">${currency(job.value)}</div>
    </div>
    <div style="margin:10px 0 6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
      ${statusChip(JOB_STATUSES[idx].label, JOB_TONE[job.status])}
      <span class="lead-age">Scheduled ${formatDate(job.scheduledDate)}${job.durationDays > 1 ? ` &middot; ${job.durationDays} days` : ""}</span>
    </div>
    <div style="display:flex;gap:8px;margin:12px 0 4px">
      ${contactQuickActions(contact)}
      ${next ? `<button class="btn btn-tonal btn-sm" id="advance-status">${icon("arrow_forward")} ${next.label}</button>` : ""}
    </div>

    ${
      progress.total
        ? `<div class="section-title">Tasks &middot; ${progress.done} of ${progress.total} done</div>
           <div class="job-progress" style="margin-bottom:16px"><div class="job-progress-bar" style="width:${pct}%"></div></div>`
        : ""
    }
    <div id="task-section"></div>
    <div id="punch-section"></div>
    <div id="budget-section"></div>
    <div id="photo-section"></div>

    <div class="section-title">Notes</div>
    <div class="card">
      <div class="field" style="margin-bottom:0">
        <textarea id="job-notes" placeholder="Add a note about this job&hellip;">${job.notes || ""}</textarea>
      </div>
    </div>
  `;

  if (next) {
    container.querySelector("#advance-status").addEventListener("click", () => advanceJob(job.id));
  }

  renderTaskSection(container.querySelector("#task-section"), job.id, "task", "Tasks", "No tasks yet — break this job into steps below.");
  renderTaskSection(container.querySelector("#punch-section"), job.id, "punch", "Punch list", "No snags logged. Add small fixes here before calling the job done.");
  renderBudgetSection(container.querySelector("#budget-section"), job);
  renderPhotoSection(container.querySelector("#photo-section"), job.id);

  const notesField = container.querySelector("#job-notes");
  let initialNotes = job.notes || "";
  notesField.addEventListener("blur", () => {
    if (notesField.value === initialNotes) return;
    update((s) => {
      const j = s.jobs.find((x) => x.id === job.id);
      if (j) j.notes = notesField.value;
    });
    initialNotes = notesField.value;
    toast("Note saved");
  });
}
