const sessionLengthMinutes = 25;
const initialSessionSeconds = sessionLengthMinutes * 60;

const timerDisplay = document.querySelector("[data-timer-display]");
const startPauseButton = document.querySelector("[data-start-pause-button]");
const resetButton = document.querySelector("[data-reset-button]");

let remainingSeconds = initialSessionSeconds;
let timerId = null;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderTime() {
  timerDisplay.textContent = formatTime(remainingSeconds);
}

function setRunning(isRunning) {
  startPauseButton.textContent = isRunning ? "Pause" : "Start";
}

function pauseTimer() {
  if (timerId === null) {
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
  if (timerId !== null || remainingSeconds <= 0) {
    return;
  }

  setRunning(true);
  timerId = setInterval(tick, 1000);
}

function resetTimer() {
  pauseTimer();
  remainingSeconds = initialSessionSeconds;
  renderTime();
}

function handleStartPauseClick() {
  if (timerId === null) {
    startTimer();
    return;
  }

  pauseTimer();
}

if (timerDisplay && startPauseButton && resetButton) {
  renderTime();
  startPauseButton.addEventListener("click", handleStartPauseClick);
  resetButton.addEventListener("click", resetTimer);
}
