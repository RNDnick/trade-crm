import { getState, update, uid } from "./store.js";
import { icon, toast, openSheet, closeSheet } from "./components.js";
import { PIPELINE_STAGES, JOB_STATUSES, LEAD_SOURCES } from "./data.js";

function contactOptions(selectedId) {
  const { contacts } = getState();
  return contacts
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => `<option value="${c.id}" ${c.id === selectedId ? "selected" : ""}>${c.name}</option>`)
    .join("");
}

function newContactFields(prefix) {
  return `
    <div id="${prefix}-new-contact" style="display:none">
      <div class="field">
        <label>Client name</label>
        <input type="text" id="${prefix}-nc-name" placeholder="e.g. John Smith" />
      </div>
      <div class="field">
        <label>Phone</label>
        <input type="tel" id="${prefix}-nc-phone" placeholder="+44 7700 900000" />
      </div>
      <div class="field">
        <label>Email</label>
        <input type="email" id="${prefix}-nc-email" placeholder="name@example.com" />
      </div>
      <div class="field">
        <label>Address</label>
        <input type="text" id="${prefix}-nc-address" placeholder="Job address" />
      </div>
    </div>`;
}

function wireContactToggle(prefix) {
  const select = document.getElementById(`${prefix}-contact`);
  const wrap = document.getElementById(`${prefix}-new-contact`);
  const toggleBtn = document.getElementById(`${prefix}-toggle-new`);
  toggleBtn.addEventListener("click", () => {
    const showing = wrap.style.display !== "none";
    wrap.style.display = showing ? "none" : "block";
    select.disabled = !showing;
    select.style.opacity = showing ? "1" : "0.5";
    toggleBtn.textContent = showing ? "+ New client instead" : "Use existing client instead";
  });
}

function resolveContactId(prefix) {
  const wrap = document.getElementById(`${prefix}-new-contact`);
  if (wrap.style.display !== "none") {
    const name = document.getElementById(`${prefix}-nc-name`).value.trim();
    if (!name) return { error: "Enter the client's name." };
    const phone = document.getElementById(`${prefix}-nc-phone`).value.trim();
    const email = document.getElementById(`${prefix}-nc-email`).value.trim();
    const address = document.getElementById(`${prefix}-nc-address`).value.trim();
    const id = uid("c");
    update((s) => s.contacts.push({ id, name, phone, email, address, notes: "" }));
    return { id };
  }
  const select = document.getElementById(`${prefix}-contact`);
  if (!select.value) return { error: "Select a client." };
  return { id: select.value };
}

export function openQuickAddSheet() {
  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">Add new</div>
    <div class="sheet-action-item" data-action="lead" role="button">
      ${icon("trending_up")}
      <span>New lead</span>
    </div>
    <div class="sheet-action-item" data-action="job" role="button">
      ${icon("construction")}
      <span>New job</span>
    </div>
    <div class="sheet-action-item" data-action="appointment" role="button">
      ${icon("event")}
      <span>New appointment</span>
    </div>
  `, {
    onOpen: (el) => {
      el.querySelectorAll("[data-action]").forEach((row) => {
        row.addEventListener("click", () => {
          const action = row.dataset.action;
          closeSheet();
          setTimeout(() => {
            if (action === "lead") openLeadForm();
            if (action === "job") openJobForm();
            if (action === "appointment") openAppointmentForm();
          }, 180);
        });
      });
    },
  });
}

function openLeadForm() {
  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">New lead</div>
    <div class="field">
      <label>Client</label>
      <select id="lead-contact">${contactOptions()}</select>
      <div style="margin-top:8px">
        <button class="btn-text" style="padding:0;height:auto" id="lead-toggle-new">+ New client instead</button>
      </div>
    </div>
    ${newContactFields("lead")}
    <div class="field">
      <label>Job description</label>
      <input type="text" id="lead-title" placeholder="e.g. Rewire — 3 bed semi" />
    </div>
    <div class="field">
      <label>Estimated value (£)</label>
      <input type="number" id="lead-value" placeholder="0" min="0" />
    </div>
    <div class="field">
      <label>Source</label>
      <select id="lead-source">${LEAD_SOURCES.map((s) => `<option>${s}</option>`).join("")}</select>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-text" data-close-sheet style="flex:1">Cancel</button>
      <button class="btn btn-filled" id="lead-save" style="flex:1">Save lead</button>
    </div>
  `, {
    onOpen: () => {
      wireContactToggle("lead");
      document.getElementById("lead-save").addEventListener("click", () => {
        const contactResult = resolveContactId("lead");
        if (contactResult.error) return toast(contactResult.error);
        const title = document.getElementById("lead-title").value.trim();
        if (!title) return toast("Enter a job description.");
        const value = Number(document.getElementById("lead-value").value) || 0;
        const source = document.getElementById("lead-source").value;
        update((s) =>
          s.leads.push({
            id: uid("l"),
            contactId: contactResult.id,
            title,
            value,
            source,
            stage: PIPELINE_STAGES[0].id,
            createdAt: new Date().toISOString(),
          })
        );
        closeSheet();
        toast("Lead added");
        location.hash = "#/pipeline";
      });
    },
  });
}

function openJobForm() {
  const today = new Date().toISOString().slice(0, 10);
  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">New job</div>
    <div class="field">
      <label>Client</label>
      <select id="job-contact">${contactOptions()}</select>
      <div style="margin-top:8px">
        <button class="btn-text" style="padding:0;height:auto" id="job-toggle-new">+ New client instead</button>
      </div>
    </div>
    ${newContactFields("job")}
    <div class="field">
      <label>Job description</label>
      <input type="text" id="job-title" placeholder="e.g. Kitchen extension electrics" />
    </div>
    <div class="field">
      <label>Value (£)</label>
      <input type="number" id="job-value" placeholder="0" min="0" />
    </div>
    <div class="field">
      <label>Scheduled date</label>
      <input type="date" id="job-date" value="${today}" />
    </div>
    <div class="field">
      <label>Status</label>
      <select id="job-status">${JOB_STATUSES.map((s) => `<option value="${s.id}">${s.label}</option>`).join("")}</select>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-text" data-close-sheet style="flex:1">Cancel</button>
      <button class="btn btn-filled" id="job-save" style="flex:1">Save job</button>
    </div>
  `, {
    onOpen: () => {
      wireContactToggle("job");
      document.getElementById("job-save").addEventListener("click", () => {
        const contactResult = resolveContactId("job");
        if (contactResult.error) return toast(contactResult.error);
        const title = document.getElementById("job-title").value.trim();
        if (!title) return toast("Enter a job description.");
        const value = Number(document.getElementById("job-value").value) || 0;
        const date = document.getElementById("job-date").value;
        const status = document.getElementById("job-status").value;
        update((s) =>
          s.jobs.push({
            id: uid("j"),
            contactId: contactResult.id,
            leadId: null,
            title,
            status,
            value,
            scheduledDate: date ? new Date(date + "T09:00:00").toISOString() : new Date().toISOString(),
            notes: "",
          })
        );
        closeSheet();
        toast("Job added");
        location.hash = "#/jobs";
      });
    },
  });
}

function openAppointmentForm() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const inHour = new Date(now.getTime() + 3600000).toTimeString().slice(0, 5);
  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">New appointment</div>
    <div class="field">
      <label>Client</label>
      <select id="appt-contact">${contactOptions()}</select>
      <div style="margin-top:8px">
        <button class="btn-text" style="padding:0;height:auto" id="appt-toggle-new">+ New client instead</button>
      </div>
    </div>
    ${newContactFields("appt")}
    <div class="field">
      <label>Title</label>
      <input type="text" id="appt-title" placeholder="e.g. Site survey" />
    </div>
    <div style="display:flex;gap:10px">
      <div class="field" style="flex:1">
        <label>Date</label>
        <input type="date" id="appt-date" value="${today}" />
      </div>
      <div class="field" style="flex:1">
        <label>Time</label>
        <input type="time" id="appt-time" value="${inHour}" />
      </div>
    </div>
    <div class="field">
      <label>Duration (minutes)</label>
      <input type="number" id="appt-duration" value="30" min="5" step="5" />
    </div>
    <div class="field">
      <label>Location</label>
      <input type="text" id="appt-location" placeholder="Job address" />
    </div>
    <div class="field">
      <label>Type</label>
      <select id="appt-type">
        <option value="quote">Quote visit</option>
        <option value="job">Job</option>
        <option value="callback">Callback</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-text" data-close-sheet style="flex:1">Cancel</button>
      <button class="btn btn-filled" id="appt-save" style="flex:1">Save appointment</button>
    </div>
  `, {
    onOpen: () => {
      wireContactToggle("appt");
      document.getElementById("appt-save").addEventListener("click", () => {
        const contactResult = resolveContactId("appt");
        if (contactResult.error) return toast(contactResult.error);
        const title = document.getElementById("appt-title").value.trim();
        if (!title) return toast("Enter a title.");
        const date = document.getElementById("appt-date").value;
        const time = document.getElementById("appt-time").value || "09:00";
        const duration = Number(document.getElementById("appt-duration").value) || 30;
        const location = document.getElementById("appt-location").value.trim();
        const type = document.getElementById("appt-type").value;
        update((s) =>
          s.appointments.push({
            id: uid("a"),
            contactId: contactResult.id,
            jobId: null,
            leadId: null,
            title,
            type,
            date: new Date(`${date}T${time}:00`).toISOString(),
            duration,
            location,
            notes: "",
          })
        );
        closeSheet();
        toast("Appointment added");
        location.hash = "#/calendar";
      });
    },
  });
}
