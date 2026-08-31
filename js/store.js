import { seedData } from "./data.js";

const STORAGE_KEY = "tradeflow.state.v1";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load state, reseeding.", e);
  }
  const fresh = seedData();
  save(fresh);
  return fresh;
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save state.", e);
  }
}

let state = load();
const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function update(mutator) {
  mutator(state);
  save(state);
  listeners.forEach((fn) => fn(state));
}

export function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// --- Convenience selectors ---

export function getContact(id) {
  return state.contacts.find((c) => c.id === id);
}

export function getLead(id) {
  return state.leads.find((l) => l.id === id);
}

export function getJob(id) {
  return state.jobs.find((j) => j.id === id);
}

export function leadsForContact(contactId) {
  return state.leads.filter((l) => l.contactId === contactId);
}

export function jobsForContact(contactId) {
  return state.jobs.filter((j) => j.contactId === contactId);
}

export function appointmentsForContact(contactId) {
  return state.appointments
    .filter((a) => a.contactId === contactId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function upcomingAppointments(limit = Infinity) {
  const now = new Date();
  return state.appointments
    .filter((a) => new Date(a.date) >= new Date(now.toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, limit);
}

export function resetDemoData() {
  state = seedData();
  save(state);
  listeners.forEach((fn) => fn(state));
}
