import { seedData, JOB_STATUSES } from "./data.js";

const STORAGE_KEY = "tradeflow.state.v1";

// Backfills fields added after a user's state was first saved, so older
// localStorage data doesn't break when the schema grows.
function migrate(state) {
  state.tasks ||= [];
  state.crew ||= [];
  state.photos ||= [];
  state.settings.hourlyRate ??= 35;
  state.jobs.forEach((j) => {
    if (j.durationDays == null) j.durationDays = 1;
    if (j.materialsCost == null) j.materialsCost = 0;
    if (j.labourHours == null) j.labourHours = 0;
  });
  return state;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
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

// --- Tasks / punch list ---

export function tasksForJob(jobId, type = "task") {
  return state.tasks.filter((t) => t.jobId === jobId && t.type === type);
}

export function taskProgress(jobId) {
  const list = tasksForJob(jobId, "task");
  return { done: list.filter((t) => t.done).length, total: list.length };
}

export function addTask(jobId, title, type, assigneeId) {
  update((s) => s.tasks.push({ id: uid("t"), jobId, type, title, done: false, assigneeId: assigneeId || null }));
}

export function toggleTask(taskId) {
  update((s) => {
    const task = s.tasks.find((t) => t.id === taskId);
    if (task) task.done = !task.done;
  });
}

export function deleteTask(taskId) {
  update((s) => {
    s.tasks = s.tasks.filter((t) => t.id !== taskId);
  });
}

// --- Crew ---

export function getCrew() {
  return state.crew;
}

export function getCrewMember(id) {
  return state.crew.find((c) => c.id === id);
}

export function addCrewMember(name) {
  update((s) => s.crew.push({ id: uid("cr"), name }));
}

export function removeCrewMember(id) {
  update((s) => {
    s.crew = s.crew.filter((c) => c.id !== id);
    s.tasks.forEach((t) => {
      if (t.assigneeId === id) t.assigneeId = null;
    });
  });
}

// --- Photos ---

export function photosForJob(jobId) {
  return state.photos.filter((p) => p.jobId === jobId);
}

export function addPhoto(jobId, dataUrl) {
  update((s) => s.photos.push({ id: uid("ph"), jobId, dataUrl, addedAt: new Date().toISOString() }));
}

export function deletePhoto(photoId) {
  update((s) => {
    s.photos = s.photos.filter((p) => p.id !== photoId);
  });
}

// --- Job status + budget ---

export function jobStatusIndex(statusId) {
  return JOB_STATUSES.findIndex((s) => s.id === statusId);
}

export function nextJobStatus(statusId) {
  const idx = jobStatusIndex(statusId);
  return idx >= 0 && idx < JOB_STATUSES.length - 1 ? JOB_STATUSES[idx + 1] : null;
}

export function advanceJob(jobId) {
  update((s) => {
    const job = s.jobs.find((j) => j.id === jobId);
    if (!job) return;
    const next = nextJobStatus(job.status);
    if (next) job.status = next.id;
  });
}

export function jobBudget(job) {
  const rate = state.settings.hourlyRate || 0;
  const materials = job.materialsCost || 0;
  const labourCost = (job.labourHours || 0) * rate;
  const cost = materials + labourCost;
  const profit = job.value - cost;
  const marginPct = job.value > 0 ? Math.round((profit / job.value) * 100) : 0;
  return { materials, labourCost, cost, profit, marginPct };
}

export function jobEndDate(job) {
  const end = new Date(job.scheduledDate);
  end.setDate(end.getDate() + (job.durationDays || 1) - 1);
  return end;
}
