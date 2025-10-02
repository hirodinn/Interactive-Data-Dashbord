// ------------------- Part 1: State Management -------------------
const state = {
  running: false,
  seriesA: [],
  seriesB: [],
  labels: [],
  intervalId: null,
  speed: 1,
  dataset: 'stocks',
  showA: true,
  showB: true,
  maxPoints: 120
};

// Generate initial seed data
function seedData() {
  state.seriesA = [];
  state.seriesB = [];
  state.labels = [];
  const now = Date.now();
  let a = state.dataset === 'stocks' ? 200 : 18;
  let b = state.dataset === 'stocks' ? 75 : 12;
  for (let i = 0; i < 40; i++) {
    a += (Math.random() - 0.48) * 4;
    b += (Math.random() - 0.48) * 2;
    state.seriesA.push(Number(a.toFixed(2)));
    state.seriesB.push(Number(b.toFixed(2)));
    state.labels.push(new Date(now - (39 - i) * 1000).toLocaleTimeString());
  }
}

function addData() {
  const lastA = state.seriesA[state.seriesA.length - 1] || (state.dataset === 'stocks' ? 200 : 18);
  const lastB = state.seriesB[state.seriesB.length - 1] || (state.dataset === 'stocks' ? 75 : 12);
  const nextA = +(lastA + (Math.random() - 0.5) * 2.2).toFixed(2);
  const nextB = +(lastB + (Math.random() - 0.5) * 1.6).toFixed(2);

  state.seriesA.push(nextA);
  state.seriesB.push(nextB);
  state.labels.push(new Date().toLocaleTimeString());

  if (state.seriesA.length > state.maxPoints) state.seriesA.shift();
  if (state.seriesB.length > state.maxPoints) state.seriesB.shift();
  if (state.labels.length > state.maxPoints) state.labels.shift();
}

// ------------------- Part 2: Chart Rendering -------------------
const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  const pad = 48;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;

  // Determine min/max
  const seriesValues = [];
  if (state.showA) seriesValues.push(...state.seriesA);
  if (state.showB) seriesValues.push(...state.seriesB);
  if (!seriesValues.length) return;
  const minVal = Math.min(...seriesValues) * 0.98;
  const maxVal = Math.max(...seriesValues) * 1.02;

  // Draw grid
  ctx.save();
  ctx.translate(pad, pad);
  drawGrid(chartW, chartH, minVal, maxVal);
  if (state.showA) drawLine(state.seriesA, chartW, chartH, minVal, maxVal, '#2563eb');
  if (state.showB) drawLine(state.seriesB, chartW, chartH, minVal, maxVal, '#ef4444');
  ctx.restore();
}

function drawGrid(w, h, minV, maxV) {
  ctx.strokeStyle = '#e6eefb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const yLines = 4;
  for (let i = 0; i <= yLines; i++) {
    const y = (h / yLines) * i;
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    const val = minV + (maxV - minV) * (1 - i / yLines);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted');
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(2), -8, y + 4);
  }
  ctx.stroke();
}

function drawLine(series, w, h, minV, maxV, color) {
  ctx.beginPath();
  const n = series.length;
  const stepX = w / Math.max(1, n - 1);
  for (let i = 0; i < n; i++) {
    const x = i * stepX;
    const t = (series[i] - minV) / (maxV - minV);
    const y = (1 - t) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

// ------------------- Part 3: Controls & Simulation -------------------
const playBtn = document.getElementById('play');
const clearBtn = document.getElementById('clear');
const speedInput = document.getElementById('speed');
const showAInput = document.getElementById('showA');
const showBInput = document.getElementById('showB');
const datasetSelect = document.getElementById('dataset-select');
const pointsCount = document.getElementById('pointsCount');
const latestA = document.getElementById('latestA');
const latestB = document.getElementById('latestB');

function updateStats() {
  pointsCount.textContent = Math.max(state.seriesA.length, state.seriesB.length);
  latestA.textContent = state.seriesA.length ? state.seriesA[state.seriesA.length - 1] : '—';
  latestB.textContent = state.seriesB.length ? state.seriesB[state.seriesB.length - 1] : '—';
}

function step() {
  addData();
  draw();
  updateStats();
}

function toggleRun() {
  state.running = !state.running;
  playBtn.textContent = state.running ? 'Pause' : 'Start';
  if (state.running) state.intervalId = setInterval(step, 1000 / state.speed);
  else clearInterval(state.intervalId);
}

function clearDataHandler() {
  seedData();
  updateStats();
  draw();
}

speedInput.addEventListener('input', e => state.speed = parseFloat(e.target.value));
showAInput.addEventListener('change', () => { state.showA = showAInput.checked; draw(); });
showBInput.addEventListener('change', () => { state.showB = showBInput.checked; draw(); });
datasetSelect.addEventListener('change', e => { state.dataset = e.target.value; seedData(); draw(); });

playBtn.addEventListener('click', toggleRun);
clearBtn.addEventListener('click', clearDataHandler);

// ------------------- Part 4: Initialization -------------------
seedData();
draw();
updateStats();

