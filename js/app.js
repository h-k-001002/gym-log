const STORAGE_KEY = "gym-log-entries";
const CUSTOM_KEY = "gym-log-custom-exercises";
const CUSTOM_VALUE = "__custom__";

const EXERCISE_GROUPS = [
  {
    label: "胸",
    emoji: "💪",
    badgeBg: "#fee2e2",
    badgeFg: "#ef4444",
    items: ["ベンチプレス", "チェストプレス（マシン）", "チェストフライ（マシン）", "チェストフライ（チューブマシン）", "インクラインベンチプレス", "ディップスマシン"],
  },
  {
    label: "背中",
    emoji: "🏹",
    badgeBg: "#ede9fe",
    badgeFg: "#7c3aed",
    items: ["ラットプルダウン", "ラットプルダウン（チューブマシン）", "ローロー", "ケーブルロー", "アシストプルアップマシン", "バックエクステンション"],
  },
  {
    label: "脚",
    emoji: "🦵",
    badgeBg: "#d1fae5",
    badgeFg: "#059669",
    items: ["レッグプレス", "レッグエクステンション", "レッグカール", "スクワット", "アブダクション（外転）", "アダクション（内転）", "カーフレイズ"],
  },
  {
    label: "肩",
    emoji: "🙆",
    badgeBg: "#fef3c7",
    badgeFg: "#d97706",
    items: ["ショルダープレス（マシン）", "サイドレイズマシン", "リアデルトフライ"],
  },
  {
    label: "腕",
    emoji: "💥",
    badgeBg: "#fce7f3",
    badgeFg: "#db2777",
    items: ["ダンベルカール", "アームカール（マシン）", "トライセプスプレスダウン", "トライセプスエクステンション"],
  },
  {
    label: "体幹",
    emoji: "🔥",
    badgeBg: "#cffafe",
    badgeFg: "#0891b2",
    items: ["腹筋（マシン）", "腹筋（腹筋ローラー）", "アブドミナルクランチ", "プランク"],
  },
];

const OTHER_CATEGORY = { label: "その他", emoji: "⭐", badgeBg: "#e2e8f0", badgeFg: "#475569" };

const form = document.getElementById("record-form");
const exerciseSelect = document.getElementById("exercise");
const exerciseCustomInput = document.getElementById("exercise-custom");
const weightInput = document.getElementById("weight");
const repsInput = document.getElementById("reps");
const history = document.getElementById("history");
const dayGroupTemplate = document.getElementById("day-group-template");
const entryTemplate = document.getElementById("entry-template");
const trendEntryTemplate = document.getElementById("trend-entry-template");
const statCardTemplate = document.getElementById("stat-card-template");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = {
  log: document.getElementById("tab-log"),
  trend: document.getElementById("tab-trend"),
};
const trendExerciseSelect = document.getElementById("trend-exercise");
const trendContent = document.getElementById("trend-content");

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

function exerciseCategory(name) {
  return EXERCISE_GROUPS.find((g) => g.items.includes(name)) || OTHER_CATEGORY;
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
    optgroup.label = `${group.emoji} ${group.label}`;
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
    optgroup.label = "⭐ よく使う（自分で追加した種目）";
    for (const name of customNames) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      optgroup.appendChild(option);
    }
    exerciseSelect.appendChild(optgroup);
  }

  const otherGroup = document.createElement("optgroup");
  otherGroup.label = "➕ その他";
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

function appendChips(container, entry) {
  container.textContent = "";

  if (entry.weight !== null) {
    const chip = document.createElement("span");
    chip.className = "chip chip-weight";
    chip.textContent = `${entry.weight}kg`;
    container.appendChild(chip);
  }

  if (entry.reps !== null) {
    const chip = document.createElement("span");
    chip.className = "chip chip-reps";
    chip.textContent = `${entry.reps}回`;
    container.appendChild(chip);
  }

  if (entry.weight === null && entry.reps === null) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.style.background = "#e2e8f0";
    chip.style.color = "#475569";
    chip.textContent = "記録のみ";
    container.appendChild(chip);
  }
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
      const category = exerciseCategory(entry.exercise);
      const badge = item.querySelector(".category-badge");
      badge.textContent = category.emoji;
      badge.style.background = category.badgeBg;
      item.querySelector(".entry-exercise").textContent = entry.exercise;
      appendChips(item.querySelector(".entry-chips"), entry);
      item.querySelector(".btn-delete").addEventListener("click", () => {
        deleteEntry(entry.id);
      });
      list.appendChild(item);
    }

    history.appendChild(group);
  }
}

function distinctExercisesByRecency(entries) {
  const latestByName = new Map();
  for (const entry of entries) {
    const current = latestByName.get(entry.exercise);
    if (current === undefined || current < entry.timestamp) {
      latestByName.set(entry.exercise, entry.timestamp);
    }
  }
  return [...latestByName.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

function buildTrendExerciseOptions() {
  const names = distinctExercisesByRecency(loadEntries());
  const previousValue = trendExerciseSelect.value;

  trendExerciseSelect.innerHTML = "";

  if (names.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "記録がありません";
    trendExerciseSelect.appendChild(option);
    trendExerciseSelect.disabled = true;
    return;
  }

  trendExerciseSelect.disabled = false;
  for (const name of names) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = `${exerciseCategory(name).emoji} ${name}`;
    trendExerciseSelect.appendChild(option);
  }
  trendExerciseSelect.value = names.includes(previousValue) ? previousValue : names[0];
}

function buildChart(series, useWeight) {
  const wrapper = document.createElement("div");
  wrapper.className = "chart-card";

  const title = document.createElement("p");
  title.className = "chart-title";
  title.textContent = useWeight ? "重量の推移 (kg)" : "回数の推移";
  wrapper.appendChild(title);

  if (series.length < 2) {
    const msg = document.createElement("p");
    msg.className = "empty-message";
    msg.style.padding = "12px 0";
    msg.textContent = series.length === 0 ? "表示できる記録がありません" : "記録が2件以上になるとグラフが表示されます";
    wrapper.appendChild(msg);
    return wrapper;
  }

  const width = 320;
  const height = 140;
  const padX = 16;
  const padY = 16;
  const values = series.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = series.map((s, i) => ({
    x: padX + (i / (series.length - 1)) * (width - padX * 2),
    y: padY + (1 - (s.value - min) / range) * (height - padY * 2),
  }));

  const pointsAttr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaAttr = `${padX},${height - padY} ${pointsAttr} ${width - padX},${height - padY}`;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const area = document.createElementNS(svgNS, "polygon");
  area.setAttribute("points", areaAttr);
  area.setAttribute("fill", "rgba(37, 99, 235, 0.12)");
  svg.appendChild(area);

  const line = document.createElementNS(svgNS, "polyline");
  line.setAttribute("points", pointsAttr);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#2563eb");
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  svg.appendChild(line);

  points.forEach((p, i) => {
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", p.x);
    circle.setAttribute("cy", p.y);
    const isLast = i === points.length - 1;
    circle.setAttribute("r", isLast ? 5 : 3.5);
    circle.setAttribute("fill", isLast ? "#f59e0b" : "#2563eb");
    svg.appendChild(circle);
  });

  wrapper.appendChild(svg);

  const datesRow = document.createElement("div");
  datesRow.className = "chart-dates";
  const first = document.createElement("span");
  first.textContent = formatDate(series[0].date);
  const last = document.createElement("span");
  last.textContent = formatDate(series[series.length - 1].date);
  datesRow.appendChild(first);
  datesRow.appendChild(last);
  wrapper.appendChild(datesRow);

  return wrapper;
}

function renderTrend() {
  trendContent.innerHTML = "";

  const name = trendExerciseSelect.value;
  if (!name) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "記録を追加すると、ここに推移が表示されます";
    trendContent.appendChild(empty);
    return;
  }

  const entries = loadEntries()
    .filter((e) => e.exercise === name)
    .sort((a, b) => a.timestamp - b.timestamp);

  const statsRow = document.createElement("div");
  statsRow.className = "stats-row";
  const weightsOnly = entries.filter((e) => e.weight !== null).map((e) => e.weight);
  const maxWeight = weightsOnly.length ? Math.max(...weightsOnly) : null;
  const lastEntry = entries[entries.length - 1];
  const stats = [
    { label: "記録回数", value: `${entries.length}回` },
    { label: "最高重量", value: maxWeight !== null ? `${maxWeight}kg` : "-" },
    { label: "前回", value: entryDetailText(lastEntry) },
  ];
  for (const stat of stats) {
    const card = statCardTemplate.content.cloneNode(true);
    card.querySelector(".stat-label").textContent = stat.label;
    card.querySelector(".stat-value").textContent = stat.value;
    statsRow.appendChild(card);
  }
  trendContent.appendChild(statsRow);

  const weighted = entries.filter((e) => e.weight !== null);
  const useWeight = weighted.length > 0;
  const series = (useWeight ? weighted : entries.filter((e) => e.reps !== null)).map((e) => ({
    date: e.date,
    value: useWeight ? e.weight : e.reps,
  }));
  trendContent.appendChild(buildChart(series, useWeight));

  const list = document.createElement("ul");
  list.className = "entry-list";
  const sortedDesc = entries.slice().sort((a, b) => b.timestamp - a.timestamp);
  for (const entry of sortedDesc) {
    const item = trendEntryTemplate.content.cloneNode(true);
    item.querySelector(".entry-exercise").textContent = formatDate(entry.date);
    appendChips(item.querySelector(".entry-chips"), entry);
    list.appendChild(item);
  }
  trendContent.appendChild(list);
}

function refreshViews() {
  render();
  buildTrendExerciseOptions();
  renderTrend();
}

function deleteEntry(id) {
  const entries = loadEntries().filter((e) => e.id !== id);
  saveEntries(entries);
  refreshViews();
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.toggle("active", b === btn));
    const tab = btn.dataset.tab;
    tabPanels.log.classList.toggle("hidden", tab !== "log");
    tabPanels.trend.classList.toggle("hidden", tab !== "trend");
  });
});

trendExerciseSelect.addEventListener("change", renderTrend);

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

  refreshViews();
});

buildExerciseOptions();
refreshViews();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}
