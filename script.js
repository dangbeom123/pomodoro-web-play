const MIN_LENGTH_MINUTES = 1;
const MAX_LENGTH_MINUTES = 60;
const MODE_SESSION = "SESSION";
const MODE_BREAK = "BREAK";

const timerDisplay = document.querySelector("[data-timer-display]");
const startPauseButton = document.querySelector("[data-start-pause-button]");
const resetButton = document.querySelector("[data-reset-button]");
const sessionDecreaseButton = document.querySelector("[data-session-decrease]");
const sessionIncreaseButton = document.querySelector("[data-session-increase]");
const sessionLengthValue = document.querySelector("[data-session-length]");
const breakDecreaseButton = document.querySelector("[data-break-decrease]");
const breakIncreaseButton = document.querySelector("[data-break-increase]");
const breakLengthValue = document.querySelector("[data-break-length]");

let sessionLengthMinutes = 25;
let breakLengthMinutes = 5;
let currentMode = MODE_SESSION;
let remainingSeconds = sessionLengthMinutes * 60;
let timerId = null;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderTime() {
  timerDisplay.textContent = formatTime(remainingSeconds);
}

function renderLengths() {
  sessionLengthValue.textContent = sessionLengthMinutes;
  breakLengthValue.textContent = breakLengthMinutes;
}

function setRunning(isRunning) {
  startPauseButton.textContent = isRunning ? "Pause" : "Start";
}

function isRunning() {
  return timerId !== null;
}

function getCurrentLengthMinutes() {
  return currentMode === MODE_BREAK ? breakLengthMinutes : sessionLengthMinutes;
}

function clampLength(minutes) {
  return Math.min(MAX_LENGTH_MINUTES, Math.max(MIN_LENGTH_MINUTES, minutes));
}

function syncIdleTimerDisplayFor(mode) {
  if (isRunning() || currentMode !== mode) {
    return;
  }

  remainingSeconds = getCurrentLengthMinutes() * 60;
  renderTime();
}

function updateSessionLength(delta) {
  sessionLengthMinutes = clampLength(sessionLengthMinutes + delta);
  renderLengths();
  syncIdleTimerDisplayFor(MODE_SESSION);
}

function updateBreakLength(delta) {
  breakLengthMinutes = clampLength(breakLengthMinutes + delta);
  renderLengths();
  syncIdleTimerDisplayFor(MODE_BREAK);
}

function pauseTimer() {
  if (!isRunning()) {
    return;
  }

  clearInterval(timerId);
  timerId = null;
  setRunning(false);
}

function tick() {
  if (remainingSeconds <= 0) {
    pauseTimer();
    renderTime();
    return;
  }

  remainingSeconds -= 1;
  renderTime();

  if (remainingSeconds === 0) {
    pauseTimer();
  }
}

function startTimer() {
  if (isRunning() || remainingSeconds <= 0) {
    return;
  }

  setRunning(true);
  timerId = setInterval(tick, 1000);
}

function resetTimer() {
  pauseTimer();
  remainingSeconds = getCurrentLengthMinutes() * 60;
  renderTime();
}

function handleStartPauseClick() {
  if (!isRunning()) {
    startTimer();
    return;
  }

  pauseTimer();
}

if (
  timerDisplay &&
  startPauseButton &&
  resetButton &&
  sessionDecreaseButton &&
  sessionIncreaseButton &&
  sessionLengthValue &&
  breakDecreaseButton &&
  breakIncreaseButton &&
  breakLengthValue
) {
  renderLengths();
  renderTime();
  startPauseButton.addEventListener("click", handleStartPauseClick);
  resetButton.addEventListener("click", resetTimer);
  sessionDecreaseButton.addEventListener("click", () => updateSessionLength(-1));
  sessionIncreaseButton.addEventListener("click", () => updateSessionLength(1));
  breakDecreaseButton.addEventListener("click", () => updateBreakLength(-1));
  breakIncreaseButton.addEventListener("click", () => updateBreakLength(1));
}
