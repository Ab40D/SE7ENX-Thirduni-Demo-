# SE7ENX — Human-to-Building Interaction Platform

### What if a building could understand you?

**SE7ENX** is an interactive smart-building simulation that explores a more natural way for people to interact with buildings through voice commands, hand gestures, and a visual interface.

Developed by **Abdelkhalek Mammeri** for the **Thirduni Community**, this browser-based demo combines an interactive 3D room, virtual device controls, multilingual commands, and an accessible interface to demonstrate the concept of human-to-building interaction.

<p align="center">
  <img src="./shots/03-app-full.png" alt="SE7ENX interactive smart-building application" width="100%">
</p>

<p align="center">
  <strong>3D Digital Twin · Voice Interaction · Hand Gestures · Multilingual UI</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> ·
  <a href="#-screenshots">Screenshots</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-privacy--limitations">Privacy & Limitations</a>
</p>

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Supported Interactions](#-supported-interactions)
- [Quick Start](#-quick-start)
- [Available Scripts](#-available-scripts)
- [Architecture](#-architecture)
- [Privacy and Limitations](#-privacy--limitations)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Community and Demo Feedback](#-community-and-demo-feedback)
- [About the Creator](#-about-the-creator)
- [Acknowledgements](#-acknowledgements)
- [License](#-license)

## 🌐 Overview

Traditional building automation often requires dedicated control panels, specialized applications, or knowledge of the underlying automation system.

SE7ENX explores a different approach: **interact with the room instead of navigating complex controls.**

The application presents a simulated smart room where users can explore virtual devices and change their states through a graphical interface, supported voice commands, and an optional camera-based gesture interface.

The project is an experimental prototype focused on the user experience and interaction layer of a potential Human-to-Building Interaction Platform.

### Project Goals

- Make smart-building interactions more intuitive and accessible.
- Explore a 3D digital-twin interface for virtual building devices.
- Support multilingual interaction, including English, French, Modern Standard Arabic, and Algerian Darija command patterns.
- Demonstrate optional voice and hand-gesture interactions in a browser.
- Explore how different interaction methods can control a shared virtual building state.
- Provide a foundation for future research into interoperable building automation interfaces.

**Project status:** Interactive simulation and prototype. It is not a production building-management system.

## ✨ Features

### 🏠 Interactive 3D Room

- A browser-based room rendered with React Three Fiber.
- Virtual devices represented within the application.
- Shared application state connecting the interface and simulated device behavior.
- Visual feedback when supported device commands are executed.

### 🎙️ Voice Commands

- Optional browser-native speech recognition where supported.
- Command parsing for supported actions and languages.
- Voice interaction designed to make common room-control tasks more natural.
- Text-based interface remains available when voice recognition is unavailable.

Voice recognition capabilities depend on the browser, operating system, language, and available speech-recognition implementation.

### ✋ Hand-Gesture Interaction

- Optional camera-based hand tracking.
- MediaPipe-based gesture-processing integration.
- A gesture interface for exploring hands-free interaction.
- Camera and gesture controls can be used only after the user grants the necessary browser permission.

Gesture recognition is a prototype feature. Its accuracy depends on lighting, camera quality, hand visibility, and the supported gesture logic.

### 🌍 Multilingual Interface

The demo explores interaction in:

- English
- French
- Modern Standard Arabic
- Algerian Darija command patterns

The interface includes Arabic right-to-left (RTL) support.

### 📱 Responsive Interface

- Desktop and mobile-oriented layouts.
- Device controls and an inspector for virtual devices.
- A guided tour for discovering the application.
- Activity history for reviewing simulated interactions.
- A monochrome visual style focused on clarity and usability.

### ⚡ Simulated Building State

The simulation includes virtual lighting, a shutter, a smart plug, a desk lamp, ambient daylight, occupancy, and derived environmental indicators.

All displayed device states belong to the simulation. The demo does not directly control physical equipment.

## 📸 Screenshots

### Main Application

![SE7ENX main application](./shots/03-app.png)

### Guided Tour

![SE7ENX guided tour](./shots/04-tour.png)

### Gesture Controls

![SE7ENX gesture control panel](./shots/05-gesture-panel.png)

### Arabic Interface

![SE7ENX Arabic interface with RTL layout](./shots/06-arabic.png)

### French Interface

![SE7ENX French interface](./shots/07-french.png)

### Mobile Experience

![SE7ENX responsive mobile interface](./shots/08-mobile-full.png)

### Live Gesture Interface

![SE7ENX live gesture interaction interface](./shots/09-gesture-live.png)

### Camera Interaction

![SE7ENX camera interaction interface](./shots/10-camera-live.png)

### Intro Screen

![SE7ENX introduction screen](./shots/01-intro.png)

### About the Project

![SE7ENX about screen](./shots/13-about-photo.png)

## 🕹️ Supported Interactions

The application demonstrates commands against virtual devices. Examples below describe intended demo interactions; the exact accepted wording depends on the command parser.

| Interaction | Example | Expected simulated action |
|---|---|---|
| Lighting | `Turn on the light` | Switch the virtual light on |
| Lighting | `Turn off the light` | Switch the virtual light off |
| Brightness | `Set brightness to 50%` | Change simulated brightness |
| Shutter | `Open the shutter` | Open the virtual shutter |
| Shutter | `Close the shutter` | Close the virtual shutter |
| Shutter | `Stop the shutter` | Stop simulated movement |
| Smart plug | `Turn on the plug` | Switch the virtual plug on |
| French | `Allume la lumière` | Request a lighting action |
| French | `Ferme le volet` | Request a shutter action |
| Arabic | `شعل الضوء` | Request a lighting action |
| Algerian Darija | `Tfi dhaw` | Request a lighting action |

These are illustrative examples, not a guarantee that every phrase or spelling variant is recognized in every browser.

### Example Virtual State

The demo may initialize with a virtual light at 70% brightness, an open shutter, an enabled smart plug, ambient daylight at 45%, occupancy enabled, and a simulated temperature of 21.5 °C.

These are software-generated values, not measurements from real sensors.

## 🚀 Quick Start

### Prerequisites

Install the following:

- Node.js and npm.
- Git.
- A modern browser such as Chromium-based Chrome or Firefox.

Check your environment:

```bash
node --version
npm --version
git --version
```

### 1. Clone the Repository

```bash
git clone https://github.com/Ab40D/SE7ENX-Thirduni-Demo-.git
cd SE7ENX-Thirduni-Demo-
```

If you already have the project locally, navigate to its root directory instead.

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

Open the local address printed in your terminal. For a standard Vite configuration, this is usually:

```text
http://localhost:5173
```

### 4. Explore the Demo

1. Open the application.
2. Explore the virtual room and device controls.
3. Try supported text commands.
4. Change the interface language.
5. Start the guided tour.
6. If desired, grant camera permission to try the gesture interface.
7. Try voice recognition if your browser supports it.

**Tip:** `localhost` is generally treated as a secure context by modern browsers for camera and microphone permissions. For a deployed site, use HTTPS.

## 🧰 Available Scripts

Run scripts from the project root.

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Run the production build, including TypeScript checks if configured in the build script |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run configured lint checks |
| `npm test` | Run the Vitest test suite |
| `npm run test:e2e` | Run the Playwright end-to-end tests |

The exact scripts depend on the current `package.json`. If a command is unavailable, inspect the scripts section before running it.

### Playwright Setup

If the project uses Playwright and Chromium has not yet been installed, run:

```bash
npx playwright install chromium
```

Then execute:

```bash
npm run test:e2e
```

## 🏗️ Architecture

SE7ENX separates the interaction logic, shared state, visual scene, and interface components.

```text
SE7ENX
├── Interaction Layer
│   ├── Graphical controls
│   ├── Voice command interface
│   └── Optional hand-gesture interface
│
├── Core Logic
│   ├── Command parsing
│   ├── Assistant / interaction logic
│   ├── Localization
│   └── Shared types
│
├── Application State
│   └── Shared simulated building state
│
├── Visualization
│   └── React Three Fiber room and virtual devices
│
└── User Interface
    ├── Device inspector
    ├── Activity history
    ├── Guided tour
    └── Responsive multilingual layouts
```

### Main Technologies

| Technology | Role |
|---|---|
| React | Component-based user interface |
| TypeScript | Typed application logic |
| Vite | Development server and build tooling |
| React Three Fiber | 3D scene integration in React |
| Three.js | Browser-based 3D rendering |
| Zustand | Shared client-side application state |
| MediaPipe | Hand-tracking and gesture-processing integration |
| Web Speech API | Browser speech-recognition integration where supported |
| Vitest | Unit and component-level testing |
| Playwright | Browser-based end-to-end testing |

This table describes the intended technology roles in the project. Exact feature availability depends on the implementation and the user's environment.

## 🔐 Privacy & Limitations

SE7ENX is designed as a browser-based simulation.

### Camera

- Camera access is optional.
- The browser requests permission before camera access.
- The gesture feature is intended to process camera input locally when the bundled MediaPipe runtime and models support that configuration.
- No claim is made that every browser dependency or processing path is fully offline without inspecting the deployed build and network activity.

### Microphone and Speech Recognition

- Voice interaction is optional.
- Speech recognition depends on browser support.
- Browser-native speech-recognition services may process audio remotely, depending on the browser and implementation.

### Data and Accounts

- The demo is intended to run without a user account or API key.
- Virtual device state is maintained in the client-side application.
- The simulation is not intended to provide persistent building state or a production backend.

### Physical Equipment

**This demo does not control physical devices.**

The current demo should not be represented as a verified integration with:

- KNX
- Home Assistant
- Shelly
- Tuya
- MQTT
- Node-RED
- PLC or SCADA systems

These are potential areas for future development, not capabilities established by this simulation.

Do not use the demo as a safety-critical building controller. No real-world actuation, alarm delivery, or safety function is provided.

## 🧪 Testing

The project includes a testing setup intended to cover application logic and browser behavior.

- **Vitest:** unit and component-level tests.
- **Playwright:** end-to-end browser tests.
- **TypeScript:** static type checking.
- **Vite build:** production compilation.

Run the available checks:

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Test results can change as the code evolves. Run the commands against the current checkout to verify its actual status.

Camera-related tests using synthetic input do not prove that gesture recognition works reliably with every real camera, lighting condition, or user.

## 🌍 Deployment

The application can be deployed as a static frontend if the project does not require a separate runtime service.

Build the application:

```bash
npm install
npm run build
```

Vite normally writes the production output to:

```text
dist/
```

Deploy the contents of `dist/` to a static hosting provider that supports single-page application routing as needed.

For camera and microphone access on a hosted site, configure HTTPS. Test the deployed application in the browsers you intend to support.

## 🗺️ Roadmap

Potential future directions include:

- More natural multilingual command interpretation.
- Improved gesture recognition and interaction feedback.
- Expanded 3D room layouts and device representations.
- More accessible controls and onboarding.
- Configurable rooms and simulated devices.
- An integration architecture for building automation protocols.
- Carefully scoped, permission-based integrations with real equipment.
- Local-first operation and explicit verification of device state.

Roadmap items are ideas for future development and should not be interpreted as implemented features.

## 🤝 Community and Demo Feedback

SE7ENX was prepared for presentation to the **Thirduni Community** as an exploration of more intuitive human-to-building interaction.

Related public videos shared in connection with the project:

- [Itqan Smart — TikTok video](https://www.tiktok.com/@itqan_smart/video/7697198593609878802)
- [Hichem Computer — TikTok video](https://www.tiktok.com/@hichem.computer/video/7697346508127096072)

These links are provided as community context. Their inclusion does not imply sponsorship, formal partnership, or official endorsement by the creators, organizations, or Thirduni.

## 👨‍💻 About the Creator

**Abdelkhalek Mammeri**  
Creator and developer of SE7ENX.

<p align="center">
  <img src="./public/creator/abdelkhalek-mammeri.jpg" alt="Abdelkhalek Mammeri" width="180">
</p>

<p align="center">
  <a href="https://github.com/Ab40D">GitHub</a> ·
  <a href="https://www.linkedin.com/in/abdelkhalekmammeri/">LinkedIn</a> ·
  <a href="https://se7en-bay.vercel.app/">Portfolio</a>
</p>

SE7ENX explores the intersection of building automation, human-computer interaction, 3D visualization, and local-first smart environments.

## 🙏 Acknowledgements

- **Thirduni Community** — the community for which this demo was developed.
- The open-source projects and developer communities behind React, TypeScript, Vite, Three.js, React Three Fiber, Zustand, MediaPipe, Vitest, and Playwright.

## 📄 License

Check the repository for a `LICENSE` file to determine the applicable license. If no license is present, the code is not automatically granted an open-source license merely because the repository is public.

---

<p align="center">
  <strong>SE7ENX — What if a building could understand you?</strong>
  <br>
  A Human-to-Building Interaction Platform prototype.
  <br>
  Developed by Abdelkhalek Mammeri for the Thirduni Community.
</p>

