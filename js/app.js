const STORAGE_KEY = "gym-log-entries";
const CUSTOM_KEY = "gym-log-custom-exercises";
const CUSTOM_VALUE = "__custom__";

const EXERCISE_GROUPS = [
  {
    label: "胸",
    items: ["ベンチプレス", "チェストプレス（マシン）", "チェストフライ（マシン）", "チェストフライ（チューブマシン）", "インクラインベンチプレス", "ディップスマシン"],
  },
  {
    label: "背中",
    items: ["ラットプルダウン", "ラットプルダウン（チューブマシン）", "ローロー", "ケーブルロー", "アシストプルアップマシン", "バックエクステンション"],
  },
  {
    label: "脚",
    items: ["レッグプレス", "レッグエクステンション", "レッグカール", "スクワット", "アブダクション（外転）", "アダクション（内転）", "カーフレイズ"],
  },
  {
    label: "肩",
    items: ["ショルダープレス（マシン）", "サイドレイズマシン", "リアデルトフライ"],
  },
  {
    label: "腕",
    items: ["ダンベルカール", "アームカール（マシン）", "トライセプスプレスダウン", "トライセプスエクステンション"],
  },
  {
    label: "体幹",
    items: ["腹筋（マシン）", "腹筋（腹筋ローラー）", "アブドミナルクランチ", "プランク"],
  },
];

const form = document.getElementById("record-form");
const exerciseSelect = document.getElementById("exercise");
const exerciseCustomInput = document.getElementById("exercise-custom");
const weightInput = document.getElementById("weight");
const repsInput = document.getElementById("reps");
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

function loadCustomExercises() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCustomExercises(names) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(names));
}

function allPresetExerciseNames() {
  return EXERCISE_GROUPS.flatMap((g) => g.items);
}

function buildExerciseOptions() {
  const preset = new Set(allPresetExerciseNames());
  const customNames = loadCustomExercises().filter((name) => !preset.has(name));

  exerciseSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "選択してください";
  placeholder.disabled = true;
  placeholder.selected = true;
  exerciseSelect.appendChild(placeholder);

  for (const group of EXERCISE_GROUPS) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    for (const name of group.items) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      optgroup.appendChild(option);
    }
    exerciseSelect.appendChild(optgroup);
  }

  if (customNames.length > 0) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = "よく使う（自分で追加した種目）";
    for (const name of customNames) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      optgroup.appendChild(option);
    }
    exerciseSelect.appendChild(optgroup);
  }

  const otherGroup = document.createElement("optgroup");
  otherGroup.label = "その他";
  const customOption = document.createElement("option");
  customOption.value = CUSTOM_VALUE;
  customOption.textContent = "＋ 自由入力で追加";
  otherGroup.appendChild(customOption);
  exerciseSelect.appendChild(otherGroup);
}

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`;
}

function entryDetailText(entry) {
  const parts = [];
  if (entry.weight !== null) parts.push(`${entry.weight}kg`);
  if (entry.reps !== null) parts.push(`${entry.reps}回`);
  return parts.join(" × ") || "-";
}

function render() {
  const entries = loadEntries();

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

exerciseSelect.addEventListener("change", () => {
  const isCustom = exerciseSelect.value === CUSTOM_VALUE;
  exerciseCustomInput.classList.toggle("hidden", !isCustom);
  exerciseCustomInput.required = isCustom;
  if (isCustom) {
    exerciseCustomInput.focus();
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const isCustom = exerciseSelect.value === CUSTOM_VALUE;
  const exercise = isCustom ? exerciseCustomInput.value.trim() : exerciseSelect.value;
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

  if (isCustom && !allPresetExerciseNames().includes(exercise)) {
    const customNames = loadCustomExercises();
    if (!customNames.includes(exercise)) {
      customNames.push(exercise);
      saveCustomExercises(customNames);
    }
  }

  buildExerciseOptions();
  exerciseSelect.value = "";
  exerciseCustomInput.value = "";
  exerciseCustomInput.classList.add("hidden");
  exerciseCustomInput.required = false;
  weightInput.value = "";
  repsInput.value = "";

  render();
});

buildExerciseOptions();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}
