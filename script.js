const state = {
  running: false,
  dataset: "stocks",
  speed: 1000,
  seriesA: [],
  seriesB: [],
  maxPoints: 30
};

function addData() {
  const lastA = state.seriesA.length ? state.seriesA[state.seriesA.length - 1] : 50;
  const lastB = state.seriesB.length ? state.seriesB[state.seriesB.length - 1] : 40;

  state.seriesA.push(lastA + (Math.random() - 0.5) * 10);
  state.seriesB.push(lastB + (Math.random() - 0.5) * 8);

  if (state.seriesA.length > state.maxPoints) state.seriesA.shift();
  if (state.seriesB.length > state.maxPoints) state.seriesB.shift();
}
const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawLine(state.seriesA, "#2563eb");
  drawLine(state.seriesB, "#f43f5e");
}

function drawGrid() {
  ctx.strokeStyle = "#ddd";
  ctx.beginPath();
  for (let i = 0; i < canvas.width; i += 50) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
  }
  for (let j = 0; j < canvas.height; j += 50) {
    ctx.moveTo(0, j);
    ctx.lineTo(canvas.width, j);
  }
  ctx.stroke();
}

function drawLine(series, color) {
  if (series.length < 2) return;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - series[0]);
  for (let i = 1; i < series.length; i++) {
    ctx.lineTo((i / series.length) * canvas.width, canvas.height - series[i]);
  }
  ctx.stroke();
}

let interval;

function toggleRun() {
  state.running = !state.running;
  if (state.running) {
    interval = setInterval(step, state.speed);
  } else {
    clearInterval(interval);
  }
}

function step() {
  addData();
  draw();
}

function clearData() {
  state.seriesA = [];
  state.seriesB = [];
  draw();
}

