import { getContact, leadsForContact, jobsForContact, appointmentsForContact, update } from "./store.js";
import { icon, avatar, currency, formatDate, formatTime, telHref, mailHref, smsHref, mapsHref, statusChip, toast } from "./components.js";
import { PIPELINE_STAGES, JOB_STATUSES } from "./data.js";

export const meta = { title: "Contact" };

const STAGE_TONE = { new: "blue", contacted: "purple", quoted: "amber", won: "green", lost: "neutral" };
const JOB_TONE = { scheduled: "blue", in_progress: "amber", complete: "purple", invoiced: "neutral", paid: "green" };

function stageLabel(id) {
  return PIPELINE_STAGES.find((s) => s.id === id)?.label || id;
}
function jobStatusLabel(id) {
  return JOB_STATUSES.find((s) => s.id === id)?.label || id;
}

export function render(container, contactId) {
  const contact = getContact(contactId);
  if (!contact) {
    container.innerHTML = `<div class="card">Contact not found. <a class="btn-text" href="#/contacts">Back to contacts</a></div>`;
    return;
  }

  const leads = leadsForContact(contactId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const jobs = jobsForContact(contactId).sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
  const appts = appointmentsForContact(contactId);
  const now = Date.now();
  const upcomingAppts = appts.filter((a) => new Date(a.date).getTime() >= now);
  const pastAppts = appts.filter((a) => new Date(a.date).getTime() < now).reverse();

  container.innerHTML = `
    <a href="#/contacts" class="btn-text" style="margin-bottom:8px;display:inline-flex;padding-left:0">${icon("arrow_back")} Contacts</a>

    <div class="detail-header">
      ${avatar(contact.name, contact.id, "lg")}
      <div class="detail-name">${contact.name}</div>
      <div class="detail-sub">${contact.address || contact.phone}</div>
      <div class="detail-actions">
        <a class="detail-action" href="${telHref(contact.phone)}"><span class="icon-circle-btn call">${icon("call")}</span>Call</a>
        <a class="detail-action" href="${mailHref(contact.email)}"><span class="icon-circle-btn mail">${icon("mail")}</span>Email</a>
        <a class="detail-action" href="${smsHref(contact.phone)}"><span class="icon-circle-btn sms">${icon("sms")}</span>Text</a>
        ${contact.address ? `<a class="detail-action" href="${mapsHref(contact.address)}" target="_blank" rel="noopener"><span class="icon-circle-btn map">${icon("directions")}</span>Directions</a>` : ""}
      </div>
    </div>

    <div class="section-title">Contact info</div>
    <div class="card">
      <div class="info-row">${icon("call")}<div class="info-row-text"><div class="info-row-label">Phone</div>${contact.phone}</div></div>
      <div class="info-row">${icon("mail")}<div class="info-row-text"><div class="info-row-label">Email</div>${contact.email}</div></div>
      ${contact.address ? `<div class="info-row">${icon("location_on")}<div class="info-row-text"><div class="info-row-label">Address</div>${contact.address}</div></div>` : ""}
    </div>

    ${leads.length ? `<div class="section-title">Leads</div><div class="card" id="leads-block"></div>` : ""}
    ${jobs.length ? `<div class="section-title">Jobs</div><div class="card" id="jobs-block"></div>` : ""}
    ${upcomingAppts.length ? `<div class="section-title">Upcoming appointments</div><div class="card" id="upcoming-block"></div>` : ""}
    ${pastAppts.length ? `<div class="section-title">Past appointments</div><div class="card" id="past-block"></div>` : ""}

    <div class="section-title">Notes</div>
    <div class="card">
      <div class="field" style="margin-bottom:0">
        <textarea id="contact-notes" placeholder="Add a note about this client…">${contact.notes || ""}</textarea>
      </div>
    </div>
  `;

  if (leads.length) {
    container.querySelector("#leads-block").innerHTML = leads
      .map(
        (l, i) => `
      <a href="#/pipeline" style="display:flex;justify-content:space-between;align-items:center;padding:${i === 0 ? "0" : "12px"} 0 12px;${i > 0 ? "border-top:1px solid var(--outline-variant)" : ""}">
        <div>
          <div style="font-size:14px;font-weight:500">${l.title}</div>
          ${statusChip(stageLabel(l.stage), STAGE_TONE[l.stage])}
        </div>
        <div style="font-weight:500">${currency(l.value)}</div>
      </a>`
      )
      .join("");
  }

  if (jobs.length) {
    container.querySelector("#jobs-block").innerHTML = jobs
      .map(
        (j, i) => `
      <a href="#/jobs/${j.id}" style="display:flex;justify-content:space-between;align-items:center;padding:${i === 0 ? "0" : "12px"} 0 12px;${i > 0 ? "border-top:1px solid var(--outline-variant)" : ""}">
        <div>
          <div style="font-size:14px;font-weight:500">${j.title}</div>
          ${statusChip(jobStatusLabel(j.status), JOB_TONE[j.status])}
        </div>
        <div style="font-weight:500">${currency(j.value)}</div>
      </a>`
      )
      .join("");
  }

  if (upcomingAppts.length) {
    container.querySelector("#upcoming-block").innerHTML = upcomingAppts
      .map(
        (a, i) => `
      <div style="display:flex;justify-content:space-between;padding:${i === 0 ? "0" : "12px"} 0 12px;${i > 0 ? "border-top:1px solid var(--outline-variant)" : ""}">
        <div>
          <div style="font-size:14px;font-weight:500">${a.title}</div>
          <div style="font-size:12.5px;color:var(--on-surface-variant)">${formatDate(a.date)} &middot; ${formatTime(a.date)}</div>
        </div>
      </div>`
      )
      .join("");
  }

  if (pastAppts.length) {
    container.querySelector("#past-block").innerHTML = pastAppts
      .slice(0, 5)
      .map(
        (a, i) => `
      <div style="display:flex;justify-content:space-between;padding:${i === 0 ? "0" : "12px"} 0 12px;${i > 0 ? "border-top:1px solid var(--outline-variant)" : ""};opacity:.75">
        <div>
          <div style="font-size:14px;font-weight:500">${a.title}</div>
          <div style="font-size:12.5px;color:var(--on-surface-variant)">${formatDate(a.date)}</div>
        </div>
      </div>`
      )
      .join("");
  }

  const notesField = container.querySelector("#contact-notes");
  let initialNotes = contact.notes || "";
  notesField.addEventListener("blur", () => {
    if (notesField.value === initialNotes) return;
    update((s) => {
      const c = s.contacts.find((c) => c.id === contactId);
      if (c) c.notes = notesField.value;
    });
    initialNotes = notesField.value;
    toast("Note saved");
  });
}
