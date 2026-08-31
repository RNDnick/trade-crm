import { getState, leadsForContact, jobsForContact } from "./store.js";
import { icon, avatar, contactQuickActions, emptyState } from "./components.js";

export const meta = { title: "Contacts" };

function contactSubtitle(contact) {
  const leads = leadsForContact(contact.id);
  const jobs = jobsForContact(contact.id);
  const activeLead = leads.find((l) => l.stage !== "won" && l.stage !== "lost");
  if (activeLead) return `Lead: ${activeLead.title}`;
  const activeJob = jobs.find((j) => j.status !== "paid");
  if (activeJob) return `Job: ${activeJob.title}`;
  if (jobs.length) return `${jobs.length} completed job${jobs.length > 1 ? "s" : ""}`;
  return contact.address || contact.phone;
}

function rowHtml(contact) {
  return `
    <a class="contact-row" href="#/contacts/${contact.id}">
      ${avatar(contact.name, contact.id, "md")}
      <div class="contact-row-body">
        <div class="contact-row-name">${contact.name}</div>
        <div class="contact-row-sub">${contactSubtitle(contact)}</div>
      </div>
      ${contactQuickActions(contact, { compact: true })}
    </a>`;
}

export function render(container) {
  const { contacts } = getState();
  container.innerHTML = `
    <div style="max-width:640px">
      <div class="search-bar">
        ${icon("search")}
        <input type="search" id="contact-search" placeholder="Search contacts" />
      </div>
      <div class="card" id="contacts-list" style="padding:0 16px"></div>
    </div>
  `;

  const list = container.querySelector("#contacts-list");
  function renderList(query) {
    const q = (query || "").trim().toLowerCase();
    const filtered = contacts
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || c.phone.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
    list.innerHTML = filtered.length ? filtered.map(rowHtml).join("") : emptyState("person_search", "No contacts found", "Try a different search, or add one with the + button.");
  }
  renderList("");

  container.querySelector("#contact-search").addEventListener("input", (e) => renderList(e.target.value));
}
