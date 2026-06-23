const chart = document.querySelector("#brewing-chart");
const context = chart.getContext("2d");
const form = document.querySelector("#brewing-form");
const extractedInput = document.querySelector("#extracted-weight");
const coffeeInput = document.querySelector("#coffee-weight");
const tdsInput = document.querySelector("#tds-percentage");
const tdsResult = document.querySelector("#tds-result");
const yieldResult = document.querySelector("#yield-result");
const resultLabel = document.querySelector("#result-label");
const formMessage = document.querySelector("#form-message");
const logBody = document.querySelector("#log-body");
const emptyLog = document.querySelector("#empty-log");

const chartRange = {
  yieldMin: 14,
  yieldMax: 26,
  tdsMin: 0.9,
  tdsMax: 1.6,
};

let currentResult = null;
let logs = loadLogs();

function calculateYield(extractedWeight, coffeeWeight, tdsPercentage) {
  return ((tdsPercentage / 100) * extractedWeight / coffeeWeight) * 100;
}

function classifyResult(yieldPercentage, tdsPercentage) {
  const yieldState = yieldPercentage < 18 ? "과소 추출" : yieldPercentage > 22 ? "과다 추출" : "권장 수율";
  const strengthState = tdsPercentage < 1.15 ? "농도가 연한 커피" : tdsPercentage > 1.35 ? "농도가 진한 커피" : "권장 농도";

  if (yieldState === "권장 수율" && strengthState === "권장 농도") {
    return "이상적인 추출 영역입니다.";
  }
  return `${strengthState} · ${yieldState}`;
}

function loadLogs() {
  try {
    const saved = JSON.parse(localStorage.getItem("brewing-control-logs") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveLogs() {
  localStorage.setItem("brewing-control-logs", JSON.stringify(logs));
}

function formatNumber(value, digits = 2) {
  return Number(value).toLocaleString("ko-KR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

function renderLogs() {
  logBody.replaceChildren();
  emptyLog.hidden = logs.length > 0;

  logs.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatNumber(item.extracted)}g</td>
      <td>${formatNumber(item.coffee)}g</td>
      <td>${formatNumber(item.tds)}%</td>
      <td>${formatNumber(item.yield, 1)}%</td>
      <td><button class="load-button" type="button" data-index="${index}">불러오기</button></td>
    `;
    logBody.append(row);
  });
}

function setCanvasSize() {
  const ratio = window.devicePixelRatio || 1;
  const bounds = chart.getBoundingClientRect();
  chart.width = Math.round(bounds.width * ratio);
  chart.height = Math.round(bounds.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawChart();
}

function drawChart() {
  const width = chart.clientWidth;
  const height = chart.clientHeight;
  const mobile = width < 600;
  const padding = mobile
    ? { top: 38, right: 18, bottom: 54, left: 52 }
    : { top: 32, right: 34, bottom: 56, left: 62 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const x = (value) => padding.left + ((value - chartRange.yieldMin) / (chartRange.yieldMax - chartRange.yieldMin)) * plotWidth;
  const y = (value) => padding.top + (1 - (value - chartRange.tdsMin) / (chartRange.tdsMax - chartRange.tdsMin)) * plotHeight;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#dcebe2";
  context.fillRect(x(18), y(1.35), x(22) - x(18), y(1.15) - y(1.35));

  context.font = `${mobile ? 10 : 11}px "Malgun Gothic", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (let yieldTick = 14; yieldTick <= 26; yieldTick += 1) {
    context.beginPath();
    context.strokeStyle = yieldTick % 2 === 0 ? "#dfe3df" : "#eef0ee";
    context.lineWidth = 1;
    context.moveTo(x(yieldTick), padding.top);
    context.lineTo(x(yieldTick), padding.top + plotHeight);
    context.stroke();
    context.fillStyle = "#68706b";
    context.fillText(String(yieldTick), x(yieldTick), padding.top + plotHeight + 18);
  }

  for (let tdsTick = 0.9; tdsTick <= 1.601; tdsTick += 0.05) {
    const rounded = Number(tdsTick.toFixed(2));
    context.beginPath();
    context.strokeStyle = Math.round(rounded * 100) % 10 === 0 ? "#dfe3df" : "#eef0ee";
    context.moveTo(padding.left, y(rounded));
    context.lineTo(padding.left + plotWidth, y(rounded));
    context.stroke();
    if (Math.round(rounded * 100) % 10 === 0 || rounded === 1.15 || rounded === 1.35) {
      context.fillStyle = "#68706b";
      context.textAlign = "right";
      context.fillText(rounded.toFixed(2), padding.left - 8, y(rounded));
    }
  }

  context.strokeStyle = "#707873";
  context.lineWidth = 1.2;
  context.strokeRect(padding.left, padding.top, plotWidth, plotHeight);

  context.fillStyle = "#1f2421";
  context.textAlign = "center";
  context.font = `700 ${mobile ? 11 : 12}px "Malgun Gothic", sans-serif`;
  context.fillText("추출 수율 (%)", padding.left + plotWidth / 2, height - 13);

  context.save();
  context.translate(14, padding.top + plotHeight / 2);
  context.rotate(-Math.PI / 2);
  context.fillText("TDS (%)", 0, 0);
  context.restore();

  drawAreaLabels(x, y, mobile);

  if (currentResult) {
    const pointX = x(currentResult.yield);
    const pointY = y(currentResult.tds);
    const clampedX = Math.max(padding.left, Math.min(padding.left + plotWidth, pointX));
    const clampedY = Math.max(padding.top, Math.min(padding.top + plotHeight, pointY));

    context.save();
    context.setLineDash([6, 5]);
    context.lineWidth = 2;
    context.strokeStyle = "#2873b8";
    context.beginPath();
    context.moveTo(padding.left, clampedY);
    context.lineTo(padding.left + plotWidth, clampedY);
    context.stroke();

    context.strokeStyle = "#155d3d";
    context.beginPath();
    context.moveTo(clampedX, padding.top);
    context.lineTo(clampedX, padding.top + plotHeight);
    context.stroke();
    context.restore();

    if (pointX >= padding.left && pointX <= padding.left + plotWidth && pointY >= padding.top && pointY <= padding.top + plotHeight) {
      context.beginPath();
      context.fillStyle = "#1f2421";
      context.arc(pointX, pointY, 5, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#ffffff";
      context.lineWidth = 2;
      context.stroke();
    }
  }
}

function drawAreaLabels(x, y, mobile) {
  context.fillStyle = "rgba(31, 36, 33, 0.68)";
  context.font = `700 ${mobile ? 9 : 11}px "Malgun Gothic", sans-serif`;
  context.textAlign = "center";

  const labels = [
    [16, 1.48, mobile ? "진함\n과소" : "농도가 진한 커피\n과소 추출"],
    [20, 1.48, "농도가 진한 커피"],
    [24, 1.48, mobile ? "진함\n과다" : "농도가 진한 커피\n과다 추출"],
    [16, 1.25, "과소 추출"],
    [20, 1.25, "이상적인 추출"],
    [24, 1.25, "과다 추출"],
    [16, 1.02, mobile ? "연함\n과소" : "농도가 연한 커피\n과소 추출"],
    [20, 1.02, "농도가 연한 커피"],
    [24, 1.02, mobile ? "연함\n과다" : "농도가 연한 커피\n과다 추출"],
  ];

  labels.forEach(([yieldValue, tdsValue, label]) => {
    const lines = label.split("\n");
    lines.forEach((line, index) => {
      context.fillText(line, x(yieldValue), y(tdsValue) + (index - (lines.length - 1) / 2) * 13);
    });
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const extracted = Number(extractedInput.value);
  const coffee = Number(coffeeInput.value);
  const tds = Number(tdsInput.value);

  if (![extracted, coffee, tds].every(Number.isFinite) || extracted <= 0 || coffee <= 0 || tds <= 0) {
    formMessage.textContent = "세 항목에 0보다 큰 숫자를 입력해 주세요.";
    return;
  }

  const yieldPercentage = calculateYield(extracted, coffee, tds);
  currentResult = { extracted, coffee, tds, yield: yieldPercentage };
  tdsResult.textContent = `${formatNumber(tds)}%`;
  yieldResult.textContent = `${formatNumber(yieldPercentage, 1)}%`;
  resultLabel.textContent = classifyResult(yieldPercentage, tds);

  logs.unshift({ ...currentResult, createdAt: new Date().toISOString() });
  saveLogs();
  renderLogs();
  drawChart();
});

document.querySelector("#clear-inputs").addEventListener("click", () => {
  form.reset();
  formMessage.textContent = "";
  extractedInput.focus();
});

document.querySelector("#clear-log").addEventListener("click", () => {
  if (logs.length === 0 || !window.confirm("측정 기록을 모두 삭제할까요?")) {
    return;
  }
  logs = [];
  saveLogs();
  renderLogs();
});

document.querySelector("#download-log").addEventListener("click", () => {
  if (logs.length === 0) {
    formMessage.textContent = "저장할 측정 기록이 없습니다.";
    return;
  }

  const rows = [
    ["추출된 커피 용량(g)", "사용한 원두 용량(g)", "TDS(%)", "추출 수율(%)", "기록 시각"],
    ...logs.map((item) => [item.extracted, item.coffee, item.tds, item.yield.toFixed(2), item.createdAt]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `brewing-control-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

logBody.addEventListener("click", (event) => {
  const button = event.target.closest(".load-button");
  if (!button) return;

  const item = logs[Number(button.dataset.index)];
  if (!item) return;

  extractedInput.value = item.extracted;
  coffeeInput.value = item.coffee;
  tdsInput.value = item.tds;
  currentResult = item;
  tdsResult.textContent = `${formatNumber(item.tds)}%`;
  yieldResult.textContent = `${formatNumber(item.yield, 1)}%`;
  resultLabel.textContent = classifyResult(item.yield, item.tds);
  drawChart();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

new ResizeObserver(setCanvasSize).observe(chart);
renderLogs();
setCanvasSize();
