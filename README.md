# Gazodoro

Gazodoro is a lightweight web application for deep reading sessions. It combines a familiar Pomodoro timer with an adaptive workflow designed for knowledge workers who need to stay focused on long-form reading without being interrupted by rigid, fixed intervals.

The product is based on the PRD for **Gazodoro: An adaptive Pomodoro timer for deep reading**.

## Product Goal

Gazodoro helps users maintain sustained attention and manage fatigue during computer-based reading tasks. Instead of asking users to constantly decide when to start, stop, extend, or shorten sessions, the app is designed to support a calmer focus rhythm through simple timer controls, optional webcam-based engagement signals, and post-session feedback.

## Target Users

- University students reading academic papers or study materials
- Researchers reviewing long documents and reports
- Professionals who spend extended periods reading on a computer
- General desktop users who want basic Pomodoro support with a path toward adaptive breaks

## Current Features

- Welcome and onboarding flow for starting a focus session
- Optional webcam permission step before entering the timer
- Camera preview screen when webcam access is granted
- Standard mode fallback when webcam access is denied, unavailable, or skipped
- Privacy messaging explaining that camera processing is local and raw video/images are not stored
- Focus, short break, and long break timer modes
- Start, pause, reset, and manual mode switching controls
- Responsive single-page interface built with vanilla web technologies

## PRD Scope

### In Scope

- Core Pomodoro timer with start, pause/resume, reset, and session transitions
- Adaptive timer behavior based on engagement signals and post-session feedback
- Basic webcam-based engagement detection, such as screen presence and gaze stability
- Post-session self-report survey for focus and fatigue
- Minimal interface optimized for deep reading tasks
- Fallback operation when webcam input is unavailable

### Out of Scope

- Advanced machine learning or predictive modeling
- High-precision eye tracking
- Gesture recognition or complex multimodal input
- User accounts, cloud sync, or backend systems
- Full task management or productivity-suite features

## Planned Adaptive Workflow

1. The user opens Gazodoro and chooses whether to enable webcam detection.
2. The user starts a focus session for deep reading.
3. If webcam access is enabled, the system estimates basic engagement signals during the session.
4. If engagement appears high, the system may preserve reading flow by extending focus time.
5. If engagement appears low, the system may suggest an early or longer break.
6. After a session, the user can answer a short focus/fatigue survey or skip it.
7. The next session can be adjusted using available engagement data and survey feedback.

## Privacy and Reliability Principles

- Webcam access must be explicitly approved by the user.
- Users can continue without camera access.
- Raw webcam video and images should not be stored.
- Timer controls must continue working even if engagement detection fails.
- The interface should clearly communicate webcam errors, denied permission, and fallback mode.

## Tech Stack

- HTML
- CSS
- JavaScript

No frameworks, build tools, or external dependencies are required.

## Run Locally

1. Clone the repository.
2. Open the project folder.
3. Open `index.html` in a modern desktop browser such as Chrome, Edge, or Firefox.

Because this is a static web app, it can run directly from the browser without installing packages.

## Project Structure

```text
.
|-- index.html
|-- styles.css
|-- script.js
|-- README.md
|-- docs/
|   |-- PRD.md
|   `-- design/
|       |-- 01-welcome.png
|       |-- 02-permission-choice.png
|       |-- 03-camera-preview.png
|       `-- 04-main-dashboard.png
|-- AGENTS.md
|-- ARCHITECT.md
|-- BUILDER.md
`-- REVIEWER.md
```

## Design Screens

The current interface follows the PRD wireframe direction:

- Welcome / onboarding screen
- Webcam permission screen
- Camera preview screen
- Main timer dashboard

Reference mockups are available in `docs/design/`.

## Success Metrics From PRD

- 80% of users report that adaptive intervals feel more natural than fixed intervals.
- Users show a 20% increase in total deep work time compared with a standard 25-minute fixed timer.
- Webcam-based fatigue detection reaches 75% accuracy when cross-checked with post-session survey feedback.
