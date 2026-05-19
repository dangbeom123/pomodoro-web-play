const SCREENS = {
  WELCOME: "welcome",
  PERMISSION: "permission",
  PREVIEW: "preview",
  DASHBOARD: "dashboard",
};

const MODES = {
  FOCUS: "FOCUS",
  SHORT_BREAK: "SHORT_BREAK",
  LONG_BREAK: "LONG_BREAK",
};

const MODE_LENGTHS = {
  [MODES.FOCUS]: 25,
  [MODES.SHORT_BREAK]: 5,
  [MODES.LONG_BREAK]: 15,
};

const screenElements = document.querySelectorAll("[data-screen]");
const startOnboardingButton = document.querySelector("[data-start-onboarding]");
const enableCameraButton = document.querySelector("[data-enable-camera]");
const skipCameraButton = document.querySelector("[data-skip-camera]");
const readyFocusButton = document.querySelector("[data-ready-focus]");
const standardModeButton = document.querySelector("[data-standard-mode]");
const cameraErrorMessage = document.querySelector("[data-camera-error]");
const cameraPreview = document.querySelector("[data-camera-preview]");
const deviceName = document.querySelector("[data-device-name]");
const timerDisplay = document.querySelector("[data-timer-display]");
const startPauseButton = document.querySelector("[data-start-pause-button]");
const resetButton = document.querySelector("[data-reset-button]");
const modeTabs = document.querySelectorAll("[data-mode-tab]");

let currentScreen = SCREENS.WELCOME;
let webcamEnabled = false;
let cameraStream = null;
let cameraError = "";

let currentMode = MODES.FOCUS;
let remainingSeconds = MODE_LENGTHS[currentMode] * 60;
let timerId = null;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function isRunning() {
  return timerId !== null;
}

function renderScreen() {
  screenElements.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === currentScreen);
  });
}

function renderCameraError() {
  if (!cameraErrorMessage) {
    return;
  }

  cameraErrorMessage.textContent = cameraError;
  cameraErrorMessage.hidden = cameraError === "";
}

function renderTimer() {
  if (timerDisplay) {
    timerDisplay.textContent = formatTime(remainingSeconds);
  }
}

function renderModeTabs() {
  modeTabs.forEach((tab) => {
    const isSelected = tab.dataset.modeTab === currentMode;
    tab.classList.toggle("is-active", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
  });
}

function setRunning(isTimerRunning) {
  if (!startPauseButton) {
    return;
  }

  startPauseButton.classList.toggle("is-running", isTimerRunning);
  startPauseButton.setAttribute("aria-label", isTimerRunning ? "Pause timer" : "Start timer");
}

function renderApp() {
  renderScreen();
  renderCameraError();
  renderTimer();
  renderModeTabs();
  setRunning(isRunning());
}

function navigateTo(screenName) {
  currentScreen = screenName;
  renderApp();
}

function getCurrentLengthSeconds() {
  return MODE_LENGTHS[currentMode] * 60;
}

function pauseTimer() {
  if (!isRunning()) {
    return;
  }

  clearInterval(timerId);
  timerId = null;
  setRunning(false);
}

function resetTimer() {
  pauseTimer();
  remainingSeconds = getCurrentLengthSeconds();
  renderTimer();
}

function selectMode(nextMode) {
  if (!MODE_LENGTHS[nextMode]) {
    return;
  }

  pauseTimer();
  currentMode = nextMode;
  remainingSeconds = getCurrentLengthSeconds();
  renderApp();
}

function switchModeAfterCountdown() {
  currentMode = currentMode === MODES.FOCUS ? MODES.SHORT_BREAK : MODES.FOCUS;
  remainingSeconds = getCurrentLengthSeconds();
  renderApp();
}

function tick() {
  if (remainingSeconds <= 0) {
    switchModeAfterCountdown();
    return;
  }

  remainingSeconds -= 1;

  if (remainingSeconds === 0) {
    switchModeAfterCountdown();
    return;
  }

  renderTimer();
}

function startTimer() {
  if (isRunning()) {
    return;
  }

  if (remainingSeconds <= 0) {
    switchModeAfterCountdown();
  }

  timerId = setInterval(tick, 1000);
  setRunning(true);
}

function handleStartPauseClick() {
  if (isRunning()) {
    pauseTimer();
    return;
  }

  startTimer();
}

function stopCameraStream() {
  if (cameraPreview) {
    cameraPreview.srcObject = null;
  }

  if (!cameraStream) {
    return;
  }

  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
}

function continueWithoutCamera() {
  webcamEnabled = false;
  stopCameraStream();
  navigateTo(SCREENS.DASHBOARD);
}

async function requestCameraPermission() {
  cameraError = "";
  renderCameraError();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    webcamEnabled = false;
    cameraError = "Camera access is not available in this browser. You can continue in standard timer mode.";
    renderCameraError();
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    webcamEnabled = true;

    if (cameraPreview) {
      cameraPreview.srcObject = cameraStream;
    }

    const [track] = cameraStream.getVideoTracks();
    if (track && deviceName) {
      deviceName.textContent = track.label || "Camera 1";
    }

    navigateTo(SCREENS.PREVIEW);
  } catch (error) {
    webcamEnabled = false;
    stopCameraStream();
    cameraError = "Camera permission was denied or the camera is unavailable. You can continue in standard timer mode.";
    renderCameraError();
  }
}

function handleReadyToFocus() {
  stopCameraStream();
  navigateTo(SCREENS.DASHBOARD);
}

function bindEvents() {
  startOnboardingButton?.addEventListener("click", () => navigateTo(SCREENS.PERMISSION));
  enableCameraButton?.addEventListener("click", requestCameraPermission);
  skipCameraButton?.addEventListener("click", continueWithoutCamera);
  readyFocusButton?.addEventListener("click", handleReadyToFocus);
  standardModeButton?.addEventListener("click", continueWithoutCamera);
  startPauseButton?.addEventListener("click", handleStartPauseClick);
  resetButton?.addEventListener("click", resetTimer);

  modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => selectMode(tab.dataset.modeTab));
  });
}

bindEvents();
renderApp();

window.Gazodoro = {
  get currentScreen() {
    return currentScreen;
  },
  get webcamEnabled() {
    return webcamEnabled;
  },
  get cameraStream() {
    return cameraStream;
  },
  get cameraError() {
    return cameraError;
  },
};
