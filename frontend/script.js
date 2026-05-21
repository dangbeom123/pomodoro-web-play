const SCREENS = {
  WELCOME: "welcome",
  PERMISSION: "permission",
  PREVIEW: "preview",
  DASHBOARD: "dashboard",
  SETTINGS: "settings",
  CAMERA_SETTINGS: "camera-settings",
  SOUND_SETTINGS: "sound-settings",
  STATISTICS_SETTINGS: "statistics-settings",
  ANALYTICS: "analytics",
  TIMER_SETTINGS: "timer-settings",
  APPEARANCE_SETTINGS: "appearance-settings",
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

const FOCUS_RESET_LOG_URL = "http://localhost:8000/log/focus-reset";
const GAZE_SAMPLE_LOG_URL = "http://localhost:8000/log/gaze-samples";
const GAZE_SAMPLE_INTERVAL_MS = 1000;
const GAZE_SAMPLE_FLUSH_SIZE = 10;

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
const openSettingsButton = document.querySelector("[data-open-settings]");
const backDashboardButtons = document.querySelectorAll("[data-back-dashboard]");
const openCameraSettingsButton = document.querySelector("[data-open-camera-settings]");
const openSoundSettingsButton = document.querySelector("[data-open-sound-settings]");
const openStatisticsSettingsButton = document.querySelector("[data-open-statistics-settings]");
const openAnalyticsButtons = document.querySelectorAll("[data-open-analytics]");
const openTimerSettingsButton = document.querySelector("[data-open-timer-settings]");
const openAppearanceSettingsButton = document.querySelector("[data-open-appearance-settings]");
const backSettingsButtons = document.querySelectorAll("[data-back-settings]");
const cameraToggleButton = document.querySelector("[data-camera-toggle]");
const cameraSelectPanel = document.querySelector("[data-camera-select-panel]");
const cameraModeLabel = document.querySelector("[data-camera-mode-label]");
const timerRing = document.querySelector("[data-timer-ring]");
const timeMinutes = document.querySelector("[data-time-minutes]");
const timeIncreaseButton = document.querySelector("[data-time-increase]");
const timeDecreaseButton = document.querySelector("[data-time-decrease]");
const volumeSlider = document.querySelector("[data-volume-slider]");
const volumeValue = document.querySelector("[data-volume-value]");
const soundNotificationToggle = document.querySelector("[data-sound-notification-toggle]");

let currentScreen = SCREENS.WELCOME;
let webcamEnabled = false;
let cameraStream = null;
let cameraError = "";

let currentMode = MODES.FOCUS;
let remainingSeconds = MODE_LENGTHS[currentMode] * 60;
let timerId = null;
let activeFocusSession = null;
let cameraModeEnabled = false;
let sessionEndSoundEnabled = true;
let gazeSampleTimerId = null;
let gazeSampleBuffer = [];
let gazeTrackingSessionId = null;
let gazeCaptureInProgress = false;
let webgazerReady = false;
let webgazerStarting = false;

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

function renderCameraMode() {
  document.body.classList.toggle("camera-mode", cameraModeEnabled);

  if (cameraModeLabel) {
    cameraModeLabel.textContent = cameraModeEnabled ? "Camera mode" : "No-camera mode";
  }

  if (timerRing) {
    timerRing.classList.toggle("is-camera-mode", cameraModeEnabled);
  }

  if (cameraToggleButton) {
    cameraToggleButton.classList.toggle("is-on", cameraModeEnabled);
    cameraToggleButton.setAttribute("aria-checked", String(cameraModeEnabled));
  }

  if (cameraSelectPanel) {
    cameraSelectPanel.hidden = !cameraModeEnabled;
  }
}

function renderTimeControls() {
  if (timeMinutes) {
    timeMinutes.textContent = `${MODE_LENGTHS[currentMode]} m`;
  }
}

function renderSoundSettings() {
  if (volumeSlider && volumeValue) {
    volumeValue.textContent = volumeSlider.value;
  }

  if (soundNotificationToggle) {
    soundNotificationToggle.classList.toggle("is-on", sessionEndSoundEnabled);
    soundNotificationToggle.setAttribute("aria-checked", String(sessionEndSoundEnabled));
  }
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
  renderCameraMode();
  renderTimeControls();
  renderSoundSettings();
  setRunning(isRunning());
}

function navigateTo(screenName) {
  currentScreen = screenName;
  renderApp();
}

function getCurrentLengthSeconds() {
  return MODE_LENGTHS[currentMode] * 60;
}

function isGazeTrackingSupported() {
  return typeof window.webgazer !== "undefined";
}

async function ensureWebGazerReady() {
  if (webgazerReady) {
    return true;
  }

  if (webgazerStarting) {
    return false;
  }

  if (!isGazeTrackingSupported()) {
    console.warn("WebGazer is unavailable. Gaze samples will not be collected.");
    return false;
  }

  webgazerStarting = true;

  try {
    window.webgazer.showVideoPreview(false);
    window.webgazer.showPredictionPoints(false);
    await window.webgazer.begin();
    webgazerReady = true;
    console.log("Gaze tracking is ready.");
    return true;
  } catch (error) {
    console.error("Gaze tracking could not start.", error);
    return false;
  } finally {
    webgazerStarting = false;
  }
}

async function flushGazeSamples() {
  if (gazeSampleBuffer.length === 0) {
    return;
  }

  const samples = gazeSampleBuffer.splice(0, gazeSampleBuffer.length);

  try {
    const response = await fetch(GAZE_SAMPLE_LOG_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ samples }),
    });

    if (!response.ok) {
      throw new Error(`Gaze sample log failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Gaze samples logged successfully.", data);
  } catch (error) {
    gazeSampleBuffer.unshift(...samples);
    console.error("Gaze sample logging failed.", error);
  }
}

async function captureGazeSample() {
  if (
    gazeCaptureInProgress ||
    !activeFocusSession ||
    !gazeTrackingSessionId ||
    currentMode !== MODES.FOCUS ||
    !cameraModeEnabled ||
    !webgazerReady
  ) {
    return;
  }

  gazeCaptureInProgress = true;

  try {
    const prediction = await window.webgazer.getCurrentPrediction();

    if (!prediction || !Number.isFinite(prediction.x) || !Number.isFinite(prediction.y)) {
      return;
    }

    gazeSampleBuffer.push({
      session_id: gazeTrackingSessionId,
      user_id: null,
      captured_at: new Date().toISOString(),
      x: prediction.x,
      y: prediction.y,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      confidence: Number.isFinite(prediction.confidence) ? prediction.confidence : null,
      source: "pomodoro_test",
      camera_mode: true,
    });

    if (gazeSampleBuffer.length >= GAZE_SAMPLE_FLUSH_SIZE) {
      await flushGazeSamples();
    }
  } catch (error) {
    console.error("Gaze sample capture failed.", error);
  } finally {
    gazeCaptureInProgress = false;
  }
}

async function startGazeTracking() {
  if (!activeFocusSession || currentMode !== MODES.FOCUS || !cameraModeEnabled || gazeSampleTimerId) {
    return;
  }

  const ready = await ensureWebGazerReady();

  if (!ready) {
    return;
  }

  if (!activeFocusSession || currentMode !== MODES.FOCUS || !cameraModeEnabled || gazeSampleTimerId) {
    return;
  }

  gazeTrackingSessionId = activeFocusSession.sessionId;
  await captureGazeSample();
  gazeSampleTimerId = window.setInterval(captureGazeSample, GAZE_SAMPLE_INTERVAL_MS);
}

async function stopGazeTracking() {
  if (gazeSampleTimerId) {
    window.clearInterval(gazeSampleTimerId);
    gazeSampleTimerId = null;
  }

  await captureGazeSample();
  gazeTrackingSessionId = null;
  await flushGazeSamples();
}

function adjustCurrentModeLength(deltaMinutes) {
  if (isRunning()) {
    return;
  }

  const nextLength = Math.min(120, Math.max(1, MODE_LENGTHS[currentMode] + deltaMinutes));
  MODE_LENGTHS[currentMode] = nextLength;
  remainingSeconds = getCurrentLengthSeconds();
  renderTimer();
  renderTimeControls();
}

function generateSessionId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `focus-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureFocusSession() {
  if (currentMode !== MODES.FOCUS || activeFocusSession) {
    return;
  }

  activeFocusSession = {
    sessionId: generateSessionId(),
    startedAt: new Date(),
    initialRemainingSeconds: remainingSeconds,
    completed: false,
  };
}

function getFocusDurationSeconds() {
  if (!activeFocusSession) {
    return 0;
  }

  if (activeFocusSession.completed || currentMode !== MODES.FOCUS) {
    return activeFocusSession.initialRemainingSeconds;
  }

  return Math.max(0, activeFocusSession.initialRemainingSeconds - remainingSeconds);
}

function logFocusReset(resetAt, focusDurationSec) {
  if (!activeFocusSession) {
    return;
  }

  const payload = {
    session_id: activeFocusSession.sessionId,
    user_id: null,
    started_at: activeFocusSession.startedAt.toISOString(),
    reset_at: resetAt.toISOString(),
    focus_duration_sec: focusDurationSec,
    reset_reason: "manual_reset",
    source: "pomodoro_test",
  };

  fetch(FOCUS_RESET_LOG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Focus reset log failed with status ${response.status}`);
      }

      return response.json();
    })
    .then((data) => {
      console.log("Focus reset logged successfully.", data);
    })
    .catch((error) => {
      console.error("Focus reset logging failed.", error);
    });
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
  const shouldLogFocusReset = Boolean(activeFocusSession);
  const resetAt = new Date();
  const focusDurationSec = getFocusDurationSeconds();

  pauseTimer();
  remainingSeconds = getCurrentLengthSeconds();
  renderTimer();

  if (shouldLogFocusReset) {
    stopGazeTracking();
    logFocusReset(resetAt, focusDurationSec);
    activeFocusSession = null;
  }
}

function selectMode(nextMode) {
  if (!MODE_LENGTHS[nextMode]) {
    return;
  }

  if (currentMode === MODES.FOCUS && activeFocusSession) {
    stopGazeTracking();
  }

  pauseTimer();
  currentMode = nextMode;
  remainingSeconds = getCurrentLengthSeconds();
  renderApp();
}

function switchModeAfterCountdown() {
  if (currentMode === MODES.FOCUS && activeFocusSession) {
    activeFocusSession.completed = true;
    stopGazeTracking();
  }

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

  ensureFocusSession();
  startGazeTracking();
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
  cameraModeEnabled = false;
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
    cameraModeEnabled = true;

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
  cameraModeEnabled = webcamEnabled;
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
  openSettingsButton?.addEventListener("click", () => navigateTo(SCREENS.SETTINGS));
  openCameraSettingsButton?.addEventListener("click", () => navigateTo(SCREENS.CAMERA_SETTINGS));
  openSoundSettingsButton?.addEventListener("click", () => navigateTo(SCREENS.SOUND_SETTINGS));
  openStatisticsSettingsButton?.addEventListener("click", () => navigateTo(SCREENS.STATISTICS_SETTINGS));
  openTimerSettingsButton?.addEventListener("click", () => navigateTo(SCREENS.TIMER_SETTINGS));
  openAppearanceSettingsButton?.addEventListener("click", () => navigateTo(SCREENS.APPEARANCE_SETTINGS));
  cameraToggleButton?.addEventListener("click", () => {
    cameraModeEnabled = !cameraModeEnabled;
    webcamEnabled = cameraModeEnabled;
    renderCameraMode();

    if (cameraModeEnabled) {
      startGazeTracking();
      return;
    }

    stopGazeTracking();
  });
  soundNotificationToggle?.addEventListener("click", () => {
    sessionEndSoundEnabled = !sessionEndSoundEnabled;
    renderSoundSettings();
  });
  volumeSlider?.addEventListener("input", renderSoundSettings);
  timeIncreaseButton?.addEventListener("click", () => adjustCurrentModeLength(1));
  timeDecreaseButton?.addEventListener("click", () => adjustCurrentModeLength(-1));

  backDashboardButtons.forEach((button) => {
    button.addEventListener("click", () => navigateTo(SCREENS.DASHBOARD));
  });

  backSettingsButtons.forEach((button) => {
    button.addEventListener("click", () => navigateTo(SCREENS.SETTINGS));
  });

  openAnalyticsButtons.forEach((button) => {
    button.addEventListener("click", () => navigateTo(SCREENS.ANALYTICS));
  });

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
  get cameraModeEnabled() {
    return cameraModeEnabled;
  },
};
