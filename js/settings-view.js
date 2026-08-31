import { getState, update, resetDemoData } from "./store.js";
import { icon, toast } from "./components.js";

export const meta = { title: "Settings" };

function fieldRow(id, label, value) {
  return `
    <div class="field">
      <label>${label}</label>
      <input type="text" id="${id}" value="${value}" />
    </div>`;
}

export function render(container) {
  const { settings } = getState();

  container.innerHTML = `
    <div class="section-title" style="margin-top:0">Business profile</div>
    <div class="card">
      ${fieldRow("settings-business", "Business name", settings.businessName)}
      ${fieldRow("settings-owner", "Your name", settings.ownerName)}
      ${fieldRow("settings-trade", "Trade", settings.trade)}
    </div>

    <div class="section-title">Calendar sync</div>
    <div class="card">
      <div class="settings-row">
        ${icon("event")}
        <div class="settings-row-text">
          <div class="settings-row-title">Google Calendar</div>
          <div class="settings-row-sub">${settings.calendarConnections.google ? "Connected" : "Not connected"}</div>
        </div>
        <div class="toggle ${settings.calendarConnections.google ? "on" : ""}" id="toggle-google"></div>
      </div>
      <div class="settings-row">
        ${icon("event")}
        <div class="settings-row-text">
          <div class="settings-row-title">Outlook Calendar</div>
          <div class="settings-row-sub">${settings.calendarConnections.outlook ? "Connected" : "Not connected"}</div>
        </div>
        <div class="toggle ${settings.calendarConnections.outlook ? "on" : ""}" id="toggle-outlook"></div>
      </div>
    </div>

    <div class="section-title">Appearance</div>
    <div class="card">
      <div class="settings-row" style="border:none;padding-top:4px">
        <div class="settings-row-text">
          <div class="settings-row-title">Theme</div>
        </div>
      </div>
      <div class="segmented">
        <button data-theme="system" class="${settings.theme === "system" ? "active" : ""}">System</button>
        <button data-theme="light" class="${settings.theme === "light" ? "active" : ""}">Light</button>
        <button data-theme="dark" class="${settings.theme === "dark" ? "active" : ""}">Dark</button>
      </div>
    </div>

    <div class="section-title">Data</div>
    <div class="card">
      <button class="btn btn-outlined btn-danger btn-block" id="reset-demo">${icon("restart_alt")} Reset demo data</button>
    </div>
  `;

  const businessInput = container.querySelector("#settings-business");
  const ownerInput = container.querySelector("#settings-owner");
  const tradeInput = container.querySelector("#settings-trade");
  const saveProfile = () => {
    update((s) => {
      s.settings.businessName = businessInput.value.trim() || s.settings.businessName;
      s.settings.ownerName = ownerInput.value.trim() || s.settings.ownerName;
      s.settings.trade = tradeInput.value.trim() || s.settings.trade;
    });
    toast("Profile updated");
  };
  [businessInput, ownerInput, tradeInput].forEach((el) => el.addEventListener("blur", saveProfile));

  container.querySelector("#toggle-google").addEventListener("click", () => {
    update((s) => (s.settings.calendarConnections.google = !s.settings.calendarConnections.google));
  });
  container.querySelector("#toggle-outlook").addEventListener("click", () => {
    update((s) => (s.settings.calendarConnections.outlook = !s.settings.calendarConnections.outlook));
  });

  container.querySelectorAll("[data-theme]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => (s.settings.theme = btn.dataset.theme));
    });
  });

  container.querySelector("#reset-demo").addEventListener("click", () => {
    if (confirm("Reset all data back to the original demo content? This can't be undone.")) {
      resetDemoData();
      toast("Demo data reset");
    }
  });
}
