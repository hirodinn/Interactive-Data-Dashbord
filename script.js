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
