const config = {
  maxPoints: 120,
  padding: 48,
  bg: getComputedStyle(document.documentElement).getPropertyValue("--card"),
};
let state = {
  running: false,
  seriesA: [],
  seriesB: [],
  labels: [],
  intervalId: null,
  speed: 1,
  dataset: "stocks",
  showA: true,
  showB: true,
};

const COLORS = { a: "#2563eb", b: "#ef4444", grid: "#cbd5e1" };

const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");
const legend = document.getElementById("legend");
const playBtn = document.getElementById("play");
const exportBtn = document.getElementById("export");
const datasetSelect = document.getElementById("dataset-select");
const speedInput = document.getElementById("speed");
const speedVal = document.getElementById("speedVal");
const pointsCount = document.getElementById("pointsCount");
const latestA = document.getElementById("latestA");
const latestB = document.getElementById("latestB");
const showAInput = document.getElementById("showA");
const showBInput = document.getElementById("showB");
const clearBtn = document.getElementById("clear");
const toggleTheme = document.getElementById("toggle-theme");

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}
window.addEventListener("resize", resizeCanvas);

function init() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark")
    document.documentElement.setAttribute("data-theme", "dark"),
      (toggleTheme.checked = true);
  const savedDataset = localStorage.getItem("dataset");
  if (savedDataset)
    (datasetSelect.value = savedDataset), (state.dataset = savedDataset);
  speedInput.addEventListener("input", onSpeedChange);
  playBtn.addEventListener("click", toggleRun);
  exportBtn.addEventListener("click", exportCSV);
  datasetSelect.addEventListener("change", onDatasetChange);
  showAInput.addEventListener("change", () => {
    state.showA = showAInput.checked;
    drawLegend();
    draw();
  });
  showBInput.addEventListener("change", () => {
    state.showB = showBInput.checked;
    drawLegend();
    draw();
  });
  clearBtn.addEventListener("click", clearData);
  toggleTheme.addEventListener("change", () => {
    document.documentElement.toggleAttribute("data-theme");
    localStorage.setItem("theme", toggleTheme.checked ? "dark" : "light");
  });
  canvas.addEventListener("mousemove", onCanvasHover);
  canvas.addEventListener("mouseleave", () => {
    tooltip.style.display = "none";
  });

  seedData();
  drawLegend();
  resizeCanvas();
}

function onSpeedChange(e) {
  state.speed = parseFloat(e.target.value);
  speedVal.textContent = state.speed.toFixed(1) + "x";
}
function onDatasetChange(e) {
  state.dataset = e.target.value;
  localStorage.setItem("dataset", state.dataset);
  resetSimulation();
}

function seedData() {
  state.seriesA = [];
  state.seriesB = [];
  state.labels = [];
  const now = Date.now();
  let a = state.dataset === "stocks" ? 200 : 18; // base
  let b = state.dataset === "stocks" ? 75 : 12;
  for (let i = 0; i < 40; i++) {
    a += (Math.random() - 0.48) * 4;
    b += (Math.random() - 0.48) * 2;
    state.seriesA.push(Number(a.toFixed(2)));
    state.seriesB.push(Number(b.toFixed(2)));
    state.labels.push(new Date(now - (39 - i) * 1000).toLocaleTimeString());
  }
}

function resetSimulation() {
  seedData();
  draw();
}

function step() {
  const lastA =
    state.seriesA[state.seriesA.length - 1] ??
    (state.dataset === "stocks" ? 200 : 18);
  const lastB =
    state.seriesB[state.seriesB.length - 1] ??
    (state.dataset === "stocks" ? 75 : 12);
  const volatility = state.dataset === "stocks" ? 2.2 : 0.6;
  const volatilityB = state.dataset === "stocks" ? 1.6 : 0.45;
  const nextA = +(
    lastA +
    (Math.random() - 0.5) * volatility * state.speed
  ).toFixed(2);
  const nextB = +(
    lastB +
    (Math.random() - 0.5) * volatilityB * state.speed
  ).toFixed(2);
  state.seriesA.push(nextA);
  state.seriesB.push(nextB);
  state.labels.push(new Date().toLocaleTimeString());
  if (state.seriesA.length > config.maxPoints) state.seriesA.shift();
  if (state.seriesB.length > config.maxPoints) state.seriesB.shift();
  if (state.labels.length > config.maxPoints) state.labels.shift();
  updateStats();
  draw();
}

function updateStats() {
  pointsCount.textContent = Math.max(
    state.seriesA.length,
    state.seriesB.length
  );
  latestA.textContent = state.seriesA.length
    ? state.seriesA[state.seriesA.length - 1]
    : "—";
  latestB.textContent = state.seriesB.length
    ? state.seriesB[state.seriesB.length - 1]
    : "—";
}

function toggleRun() {
  state.running = !state.running;
  playBtn.textContent = state.running ? "Pause" : "Start";
  if (state.running) {
    const baseMs = 1000;
    state.intervalId = setInterval(step, baseMs / state.speed);
  } else {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

function clearData() {
  seedData();
  updateStats();
  draw();
}

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
    "--card"
  );
  ctx.fillRect(0, 0, w, h);
  const pad = config.padding;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;

  const seriesA = state.seriesA.slice(-config.maxPoints);
  const seriesB = state.seriesB.slice(-config.maxPoints);
  const allValues = [].concat(
    state.showA ? seriesA : [],
    state.showB ? seriesB : []
  );
  if (allValues.length === 0) return;
  const minVal = Math.min(...allValues) * 0.98;
  const maxVal = Math.max(...allValues) * 1.02;

  ctx.save();
  ctx.translate(pad, pad);
  drawGrid(chartW, chartH, minVal, maxVal);

  if (state.showA) drawLine(seriesA, chartW, chartH, minVal, maxVal, COLORS.a);
  if (state.showB) drawLine(seriesB, chartW, chartH, minVal, maxVal, COLORS.b);

  ctx.restore();
  drawLegend();
}

function drawGrid(w, h, minV, maxV) {
  ctx.beginPath();
  ctx.strokeStyle = "#e6eefb";
  ctx.lineWidth = 1;
  const yLines = 4;
  for (let i = 0; i <= yLines; i++) {
    const y = (h / yLines) * i;
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
    "--muted"
  );
  ctx.font = "12px sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= yLines; i++) {
    const v = minV + (maxV - minV) * (1 - i / yLines);
    const y = (h / yLines) * i;
    ctx.fillText(v.toFixed(2), -8, y + 4);
  }
}

function drawLine(series, w, h, minV, maxV, color) {
  if (!series || series.length === 0) return;
  const n = series.length;
  const stepX = w / Math.max(1, n - 1);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = i * stepX;
    const t = (series[i] - minV) / (maxV - minV);
    const y = (1 - t) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const x = i * stepX;
    const t = (series[i] - minV) / (maxV - minV);
    const y = (1 - t) * h;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawLegend() {
  legend.innerHTML = "";
  const makeItem = (label, color, visible) => {
    const it = document.createElement("div");
    it.className = "item";
    const sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = color;
    sw.style.opacity = visible ? "1" : "0.3";
    it.appendChild(sw);
    const txt = document.createElement("div");
    txt.textContent = label;
    txt.style.color = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--muted");
    it.appendChild(txt);
    return it;
  };
  if (true)
    legend.appendChild(
      makeItem(
        "Series A — " + (state.dataset === "stocks" ? "Price" : "Temp"),
        COLORS.a,
        state.showA
      )
    );
  if (true)
    legend.appendChild(
      makeItem(
        "Series B — " + (state.dataset === "stocks" ? "Indicator" : "Humidity"),
        COLORS.b,
        state.showB
      )
    );
}

function onCanvasHover(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - config.padding;
  const y = e.clientY - rect.top - config.padding;
  const w = canvas.clientWidth - config.padding * 2;
  const h = canvas.clientHeight - config.padding * 2;
  const seriesA = state.seriesA.slice(-config.maxPoints);
  const seriesB = state.seriesB.slice(-config.maxPoints);
  const n = Math.max(seriesA.length, seriesB.length);
  if (n === 0) return;
  const stepX = w / Math.max(1, n - 1);
  let idx = Math.round(x / stepX);
  idx = Math.max(0, Math.min(n - 1, idx));
  const parts = [];
  if (state.showA && seriesA[idx] !== undefined)
    parts.push("A: " + seriesA[idx]);
  if (state.showB && seriesB[idx] !== undefined)
    parts.push("B: " + seriesB[idx]);
  const label = state.labels[idx] || "";
  tooltip.style.display = "block";
  tooltip.textContent = label + " — " + parts.join(" | ");
  tooltip.style.left =
    config.padding + idx * stepX + rect.left - rect.left + "px";
  tooltip.style.top = config.padding + (y || 0) + "px";
}

function exportCSV() {
  const rows = [];
  const n = Math.max(state.seriesA.length, state.seriesB.length);
  rows.push(["time", "seriesA", "seriesB"]);
  for (let i = 0; i < n; i++) {
    rows.push([
      state.labels[i] || "",
      state.seriesA[i] === undefined ? "" : state.seriesA[i],
      state.seriesB[i] === undefined ? "" : state.seriesB[i],
    ]);
  }
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

setInterval(() => {
  if (state.running && state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = setInterval(step, 1000 / state.speed);
  }
}, 500);

init();
