import { getState, subscribe } from "./store.js";
import { icon, avatar } from "./components.js";
import { openQuickAddSheet } from "./quick-add.js";

import * as DashboardView from "./dashboard-view.js";
import * as PipelineView from "./pipeline-view.js";
import * as ContactsView from "./contacts-view.js";
import * as ContactDetailView from "./contact-detail-view.js";
import * as CalendarView from "./calendar-view.js";
import * as JobsView from "./jobs-view.js";
import * as JobDetailView from "./job-detail-view.js";
import * as SettingsView from "./settings-view.js";

const NAV_ITEMS = [
  { path: "#/", icon: "home", label: "Home" },
  { path: "#/pipeline", icon: "trending_up", label: "Pipeline" },
  { path: "#/contacts", icon: "contacts", label: "Contacts" },
  { path: "#/calendar", icon: "calendar_month", label: "Calendar" },
  { path: "#/jobs", icon: "construction", label: "Jobs" },
];

const ROUTES = [
  { pattern: /^#\/$/, view: DashboardView, section: "#/" },
  { pattern: /^#\/pipeline$/, view: PipelineView, section: "#/pipeline" },
  { pattern: /^#\/contacts$/, view: ContactsView, section: "#/contacts" },
  { pattern: /^#\/contacts\/([\w]+)$/, view: ContactDetailView, section: "#/contacts" },
  { pattern: /^#\/calendar$/, view: CalendarView, section: "#/calendar" },
  { pattern: /^#\/jobs$/, view: JobsView, section: "#/jobs" },
  { pattern: /^#\/jobs\/([\w]+)$/, view: JobDetailView, section: "#/jobs" },
  { pattern: /^#\/settings$/, view: SettingsView, section: "#/settings" },
];

const root = document.getElementById("app-root");

function applyTheme() {
  const { theme } = getState().settings;
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function shellHtml() {
  const { settings } = getState();
  const businessInitial = (settings.businessName || "T")[0].toUpperCase();
  return `
    <nav class="bottom-nav">
      <div class="nav-brand desktop-only">
        <div class="topbar-logo">${businessInitial}</div>
        <div>
          <div class="nav-brand-title">TradeFlow</div>
          <div class="nav-brand-sub">${settings.businessName}</div>
        </div>
      </div>
      ${NAV_ITEMS.map(
        (item) => `
        <a class="nav-item" data-path="${item.path}" href="${item.path}">
          ${icon(item.icon)}
          <span>${item.label}</span>
        </a>`
      ).join("")}
    </nav>
    <div class="app-body">
      <header class="topbar">
        <span class="topbar-title" id="topbar-title">TradeFlow</span>
        <a class="topbar-icon-btn" href="#/settings" aria-label="Settings">${icon("settings")}</a>
      </header>
      <main class="main-content" id="main-content"></main>
      <button class="fab" id="fab-btn" aria-label="Add new">${icon("add")}</button>
    </div>
  `;
}

function renderShellOnce() {
  root.innerHTML = shellHtml();
  document.getElementById("fab-btn").addEventListener("click", openQuickAddSheet);
}

function currentRoute() {
  const hash = location.hash || "#/";
  for (const route of ROUTES) {
    const match = hash.match(route.pattern);
    if (match) return { route, params: match.slice(1) };
  }
  return { route: ROUTES[0], params: [] };
}

function updateNavActive(section) {
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.path === section);
  });
}

function renderView() {
  const { route, params } = currentRoute();
  document.getElementById("topbar-title").textContent = route.view.meta.title;
  updateNavActive(route.section);
  const container = document.getElementById("main-content");
  container.innerHTML = "";
  route.view.render(container, ...params);
  window.scrollTo({ top: 0 });
}

function boot() {
  applyTheme();
  renderShellOnce();
  renderView();
  window.addEventListener("hashchange", renderView);
  subscribe(() => {
    applyTheme();
    renderView();
  });
}

boot();
