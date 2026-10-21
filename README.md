# SE7ENX — Human-to-Building Interaction Platform

### What if a building could understand you?

**SE7ENX** is an interactive smart-building simulation that explores a more natural way for people to interact with buildings through **voice commands, hand gestures, conversational text, and a 3D digital twin**.

Developed by **Abdelkhalek Mammeri** for the **Thirduni Community**, this project demonstrates how human-building interaction could evolve into a unified interface for smart homes, offices, hotels, and future building automation systems.

> **Project status:** Community demonstration · Simulation only  
> No physical building equipment is connected. This project does not imply official Thirduni endorsement or partnership.

---

## Project Overview

Traditional building automation often requires dedicated control panels, switches, mobile applications, or technical knowledge of automation systems.

SE7ENX explores an alternative: **interact with a virtual building naturally, using the method that feels right to you.**

Visitors can explore a virtual room, control simulated devices, issue commands in multiple languages, and observe the results immediately in the 3D environment.

The application is designed as a runnable web application rather than a static UI mockup.

### Core capabilities

- **3D Digital Twin:** An interactive virtual room with furniture, lighting, a motorised shutter, a smart plug, and environmental effects.
- **Voice Interaction:** Optional browser-native speech recognition, subject to browser support and permissions.
- **Hand Gesture Interaction:** Optional camera-based hand tracking using MediaPipe.
- **Conversational Interface:** Type commands or ask supported questions about the simulated room.
- **Multilingual Support:** English, French, Modern Standard Arabic, and Algerian Darija.
- **Unified Control State:** Manual controls, text commands, voice commands, and recognised gestures operate on the same simulation state.
- **Device Inspector:** Examine virtual device states and values.
- **Activity History:** Review actions and their interaction sources.
- **Guided Tour:** Explore the interface through a seven-step walkthrough.
- **Responsive Interface:** Designed for desktop and mobile screens, with right-to-left support for Arabic.

## Explore the Demo

Start the application locally:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

For camera and microphone access, use `localhost` or an appropriately configured HTTPS deployment.

### Try these commands

| Language | Example |
|---|---|
| English | `Turn on the light.` |
| English | `Set brightness to 45 percent.` |
| English | `Open the shutter.` |
| French | `Allume la lumière.` |
| French | `Ouvre le volet.` |
| Arabic | `شعل الضوء` |
| Arabic | `افتح الستارة` |
| Algerian Darija | `شعل الضو` |
| Algerian Darija | `حلّ الفولي` |

You can also control the devices manually or interact directly with the objects in the 3D room.

## Virtual Devices

The simulation includes:

- Ceiling light with on/off control and adjustable brightness.
- Motorised shutter with open, close, stop, and position controls.
- Smart plug and a desk lamp that follows its simulated state.
- Ambient daylight level.
- Room occupancy state.
- A derived virtual room temperature and simulated power consumption.

All controls operate on one shared state, keeping the 3D scene, device panels, inspector, and activity history consistent.

## Community & Demo Feedback

SE7ENX is being shared with people interested in building automation, technology, and human-computer interaction. Feedback and independent testing help identify opportunities to improve the experience.

### Itqan Smart — KNX Training & Smart Building Automation

A look at the SE7ENX project shared through Itqan Smart, a training environment associated with KNX and smart-building automation.

**Watch on TikTok:**  
https://www.tiktok.com/@itqan_smart/video/7697198593609878802

### Hichem Computer — Technology Community

A related project demonstration shared through Hichem Computer.

**Watch on TikTok:**  
https://www.tiktok.com/@hichem.computer/video/7697346508127096072

These links are shared as community references. Their inclusion does not imply formal sponsorship, endorsement, or partnership with SE7ENX or Thirduni.

## Technical Architecture

SE7ENX is built around a separation between the simulation engine and the browser interface.

- **React + TypeScript:** Application interface and typed application logic.
- **Vite:** Development server and static production build.
- **React Three Fiber + Three.js:** Interactive 3D room and virtual devices.
- **Zustand:** Shared application and simulation state.
- **MediaPipe:** Optional local hand-gesture tracking.
- **Web Speech API:** Optional browser-native speech recognition and speech features.
- **Vitest:** Unit testing.
- **Playwright:** Browser end-to-end testing.

The core simulation engine, command parser, and assistant logic are designed to remain independent of React and browser APIs, making them easier to test.

## Privacy & Transparency

SE7ENX is a browser-based simulation with no account requirement, backend, database, or physical building connection.

- Camera access is requested only after the visitor explicitly enables it.
- Hand-tracking inference runs locally in the browser when the bundled model and runtime are used.
- Video frames are not uploaded or recorded by the application.
- Speech recognition depends on browser support. The browser provider may process audio remotely.
- Manual controls and text commands remain available when camera or microphone access is unavailable.
- Commands affect virtual devices only.

**SE7ENX does not currently control real KNX devices, Home Assistant, Shelly, Tuya, MQTT brokers, PLCs, or other physical equipment.**

## Current Limitations

This project is an experimental demonstration, not a production building-management system.

- Commands are handled by a deterministic, rule-based parser rather than an unrestricted AI model.
- Speech recognition quality varies by browser, operating system, and language.
- Real-world gesture recognition still requires testing with physical cameras and actual users.
- Simulation state resets when the page is reloaded.
- Real hardware integrations, commissioning tools, and production-grade automation are future development directions.

## Roadmap

Potential future directions include:

- Optional integration with local smart-home and building-automation systems.
- KNX and MQTT adapters with explicit permissions and verified device state.
- More device types, including blinds, garage doors, HVAC, and environmental sensors.
- Improved natural-language interaction and multilingual command coverage.
- A more comprehensive digital-twin editor and mobile experience.

These are future goals, not claims about existing functionality.

## Run Tests

```bash
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Install the project dependencies first. Browser tests require the Playwright Chromium browser.

## Contributing & Feedback

Feedback, usability observations, bug reports, and ideas for future building-automation features are welcome.

If you test the demo, consider sharing:

- Which interaction method you tried.
- Which language you used.
- What worked as expected.
- Any bugs, accessibility issues, or suggested improvements.

## Credits

**Creator:** Abdelkhalek Mammeri  
**Community:** Thirduni Community  
**Project:** SE7ENX — Human-to-Building Interaction Platform

Created as a community demonstration exploring more intuitive interactions between people and buildings.

Thirduni is acknowledged as the intended community audience. No official endorsement or partnership is implied.

---

**SE7ENX — A building interface designed around people.**
