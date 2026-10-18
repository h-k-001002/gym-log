const STORAGE_KEY = "gym-log-entries";

const form = document.getElementById("record-form");
const exerciseInput = document.getElementById("exercise");
const weightInput = document.getElementById("weight");
const repsInput = document.getElementById("reps");
const exerciseOptions = document.getElementById("exercise-options");
const history = document.getElementById("history");
const dayGroupTemplate = document.getElementById("day-group-template");
const entryTemplate = document.getElementById("entry-template");

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`;
}

function renderExerciseOptions(entries) {
  const names = [...new Set(entries.map((e) => e.exercise))];
  exerciseOptions.innerHTML = names
    .map((name) => `<option value="${escapeHtml(name)}"></option>`)
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function entryDetailText(entry) {
  const parts = [];
  if (entry.weight !== null) parts.push(`${entry.weight}kg`);
  if (entry.reps !== null) parts.push(`${entry.reps}回`);
  return parts.join(" × ") || "-";
}

function render() {
  const entries = loadEntries();
  renderExerciseOptions(entries);

  history.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "まだ記録がありません";
    history.appendChild(empty);
    return;
  }

  const byDate = new Map();
  for (const entry of entries) {
    if (!byDate.has(entry.date)) byDate.set(entry.date, []);
    byDate.get(entry.date).push(entry);
  }

  const dates = [...byDate.keys()].sort((a, b) => (a < b ? 1 : -1));

  for (const date of dates) {
    const group = dayGroupTemplate.content.cloneNode(true);
    group.querySelector(".day-title").textContent = formatDate(date);
    const list = group.querySelector(".entry-list");

    const dayEntries = byDate.get(date).slice().sort((a, b) => b.timestamp - a.timestamp);
    for (const entry of dayEntries) {
      const item = entryTemplate.content.cloneNode(true);
      item.querySelector(".entry-exercise").textContent = entry.exercise;
      item.querySelector(".entry-detail").textContent = entryDetailText(entry);
      item.querySelector(".btn-delete").addEventListener("click", () => {
        deleteEntry(entry.id);
      });
      list.appendChild(item);
    }

    history.appendChild(group);
  }
}

function deleteEntry(id) {
  const entries = loadEntries().filter((e) => e.id !== id);
  saveEntries(entries);
  render();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const exercise = exerciseInput.value.trim();
  if (!exercise) return;

  const weight = weightInput.value === "" ? null : Number(weightInput.value);
  const reps = repsInput.value === "" ? null : Number(repsInput.value);

  const now = new Date();
  const entry = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    exercise,
    weight,
    reps,
    date: now.toISOString().slice(0, 10),
    timestamp: now.getTime(),
  };

  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);

  weightInput.value = "";
  repsInput.value = "";
  exerciseInput.focus();

  render();
});

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}
