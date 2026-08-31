import { getState, getContact, update, uid } from "./store.js";
import { icon, currency, daysAgo, contactQuickActions, statusChip, emptyState } from "./components.js";
import { PIPELINE_STAGES } from "./data.js";

export const meta = { title: "Pipeline" };

const STAGE_TONE = { new: "blue", contacted: "purple", quoted: "amber", won: "green", lost: "neutral" };

let activeStage = "new";

function leadsByStage(stage) {
  return getState()
    .leads.filter((l) => l.stage === stage)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function moveLead(id, stage) {
  update((s) => {
    const lead = s.leads.find((l) => l.id === id);
    if (lead) lead.stage = stage;
  });
}

function convertToJob(lead) {
  const existing = getState().jobs.find((j) => j.leadId === lead.id);
  if (existing) {
    location.hash = "#/jobs";
    return;
  }
  update((s) => {
    s.jobs.push({
      id: uid("j"),
      contactId: lead.contactId,
      leadId: lead.id,
      title: lead.title,
      status: "scheduled",
      value: lead.value,
      scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      notes: "",
    });
  });
  location.hash = "#/jobs";
}

function stageActions(lead) {
  const stage = lead.stage;
  if (stage === "new") {
    return `<button class="btn btn-tonal btn-sm" data-move="contacted">${icon("call", "icon-fill")} Mark contacted</button>`;
  }
  if (stage === "contacted") {
    return `
      <button class="btn btn-text btn-sm" data-move="new">${icon("arrow_back")}</button>
      <button class="btn btn-tonal btn-sm" data-move="quoted">${icon("request_quote")} Quote sent</button>`;
  }
  if (stage === "quoted") {
    return `
      <button class="btn btn-text btn-sm" data-move="contacted">${icon("arrow_back")}</button>
      <button class="btn btn-tonal btn-sm" data-move="won" style="background:var(--success-container);color:var(--success)">${icon("check")} Won</button>
      <button class="btn btn-text btn-sm btn-danger" data-move="lost">Lost</button>`;
  }
  if (stage === "won") {
    const hasJob = getState().jobs.some((j) => j.leadId === lead.id);
    return `<button class="btn btn-tonal btn-sm" data-convert="1">${icon("construction")} ${hasJob ? "View job" : "Convert to job"}</button>`;
  }
  if (stage === "lost") {
    return `<button class="btn btn-text btn-sm" data-move="contacted">${icon("refresh")} Reopen</button>`;
  }
  return "";
}

function leadCardHtml(lead) {
  const contact = getContact(lead.contactId);
  return `
    <div class="card lead-card" data-lead-id="${lead.id}" draggable="true">
      <div class="lead-card-top">
        <div>
          <div class="lead-title">${lead.title}</div>
          <a href="#/contacts/${contact.id}" class="lead-name" onclick="event.stopPropagation()">${contact.name}</a>
        </div>
        <div class="lead-value">${currency(lead.value)}</div>
      </div>
      <div class="lead-meta-row">
        ${statusChip(lead.source, "neutral")}
        <span class="lead-age">${daysAgo(lead.createdAt)}</span>
      </div>
      <div class="lead-meta-row">
        ${contactQuickActions(contact, { compact: true })}
      </div>
      <div class="stage-move" onclick="event.stopPropagation()">
        ${stageActions(lead)}
      </div>
    </div>`;
}

function wireCardActions(root) {
  root.querySelectorAll("[data-move]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const card = btn.closest("[data-lead-id]");
      moveLead(card.dataset.leadId, btn.dataset.move);
    });
  });
  root.querySelectorAll("[data-convert]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const card = btn.closest("[data-lead-id]");
      const lead = getState().leads.find((l) => l.id === card.dataset.leadId);
      convertToJob(lead);
    });
  });
}

function wireDragAndDrop(kanbanEl) {
  kanbanEl.querySelectorAll(".lead-card").forEach((card) => {
    card.addEventListener("dragstart", () => card.classList.add("dragging"));
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });
  kanbanEl.querySelectorAll(".kanban-col").forEach((col) => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      col.classList.add("drag-over");
    });
    col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const dragging = kanbanEl.querySelector(".dragging");
      if (dragging) moveLead(dragging.dataset.leadId, col.dataset.stage);
    });
  });
}

export function render(container) {
  const counts = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.id, leadsByStage(s.id).length]));
  if (!leadsByStage(activeStage).length) {
    const firstNonEmpty = PIPELINE_STAGES.find((s) => counts[s.id] > 0);
    activeStage = firstNonEmpty ? firstNonEmpty.id : "new";
  }

  container.innerHTML = `
    <div class="section-row" style="margin-top:0">
      <div class="section-title" style="margin:0">Leads pipeline</div>
      <span style="font-size:13px;color:var(--on-surface-variant)">${getState().leads.length} total</span>
    </div>

    <div class="stage-tabs">
      ${PIPELINE_STAGES.map(
        (s) => `<button class="stage-tab ${s.id === activeStage ? "active" : ""}" data-stage="${s.id}">${s.label} <span class="count">${counts[s.id]}</span></button>`
      ).join("")}
    </div>

    <div class="pipeline-mobile" id="pipeline-mobile-list"></div>

    <div class="kanban">
      ${PIPELINE_STAGES.map(
        (s) => `
        <div class="kanban-col" data-stage="${s.id}">
          <div class="kanban-col-header">${statusChip(s.label, STAGE_TONE[s.id])} <span>${counts[s.id]}</span></div>
          <div class="kanban-col-body">${leadsByStage(s.id).map(leadCardHtml).join("") || ""}</div>
        </div>`
      ).join("")}
    </div>
  `;

  const mobileList = container.querySelector("#pipeline-mobile-list");
  function renderMobileList() {
    const leads = leadsByStage(activeStage);
    mobileList.innerHTML = leads.length ? leads.map(leadCardHtml).join("") : emptyState("filter_alt", "No leads in this stage", "Move leads here or add a new one with the + button.");
    wireCardActions(mobileList);
  }
  renderMobileList();

  container.querySelectorAll(".stage-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      activeStage = tab.dataset.stage;
      container.querySelectorAll(".stage-tab").forEach((t) => t.classList.toggle("active", t === tab));
      renderMobileList();
    });
  });

  const kanban = container.querySelector(".kanban");
  wireCardActions(kanban);
  wireDragAndDrop(kanban);
}
