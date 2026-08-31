import { colorForId } from "./data.js";

export function icon(name, cls = "") {
  return `<span class="material-symbols-outlined icon ${cls}">${name}</span>`;
}

export function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export function avatar(name, id, size = "md") {
  const bg = colorForId(id || name);
  return `<span class="avatar avatar-${size}" style="background:${bg}">${initials(name)}</span>`;
}

export function currency(value) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(iso, opts = {}) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", ...opts });
}

export function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function relativeDay(iso) {
  const target = new Date(iso);
  const today = new Date();
  const t0 = new Date(today.toDateString());
  const t1 = new Date(target.toDateString());
  const diff = Math.round((t1 - t0) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return target.toLocaleDateString("en-GB", { weekday: "long" });
  return formatDate(iso);
}

export function daysAgo(iso) {
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export function telHref(phone) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export function mailHref(email, subject = "") {
  return subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
}

export function smsHref(phone) {
  return `sms:${phone.replace(/\s+/g, "")}`;
}

export function mapsHref(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function contactQuickActions(contact, { compact = false } = {}) {
  const label = compact ? "" : `<span>Call</span>`;
  const label2 = compact ? "" : `<span>Email</span>`;
  return `
    <div class="quick-actions" onclick="event.stopPropagation()">
      <a class="quick-action call" href="${telHref(contact.phone)}" aria-label="Call ${contact.name}">${icon("call")}${label}</a>
      <a class="quick-action mail" href="${mailHref(contact.email)}" aria-label="Email ${contact.name}">${icon("mail")}${label2}</a>
    </div>`;
}

export function statusChip(label, tone = "neutral") {
  return `<span class="chip chip-${tone}">${label}</span>`;
}

export function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 2400);
}

let sheetBackdrop = null;

export function openSheet(html, { onOpen } = {}) {
  closeSheet();
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `<div class="sheet" role="dialog">${html}</div>`;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeSheet();
  });
  document.body.appendChild(backdrop);
  sheetBackdrop = backdrop;
  requestAnimationFrame(() => backdrop.classList.add("show"));
  const closeEls = backdrop.querySelectorAll("[data-close-sheet]");
  closeEls.forEach((el) => el.addEventListener("click", closeSheet));
  if (onOpen) onOpen(backdrop);
  return backdrop;
}

export function closeSheet() {
  if (!sheetBackdrop) return;
  sheetBackdrop.classList.remove("show");
  const el = sheetBackdrop;
  setTimeout(() => el.remove(), 200);
  sheetBackdrop = null;
}

export function emptyState(iconName, title, subtitle) {
  return `
    <div class="empty-state">
      ${icon(iconName, "empty-icon")}
      <p class="empty-title">${title}</p>
      <p class="empty-subtitle">${subtitle}</p>
    </div>`;
}
