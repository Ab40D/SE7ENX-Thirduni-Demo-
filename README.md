# SE7ENX — Human-to-Building Interaction Platform

> **What if a building could understand you?**
> A simulated smart-building experience where a virtual room can be driven by
> **voice**, **hand gestures**, or a **simple interface** — all in the browser.

Created by **Abdelkhalek Mammeri** for the **Thirduni Community**.

> **Community demonstration. Simulation only. No physical building equipment is
> connected. This project does not imply official Thirduni endorsement or
> partnership.**

---

## Table of contents

1. [What it is](#what-it-is)
2. [Quick start](#quick-start)
3. [Feature tour](#feature-tour)
4. [Command reference](#command-reference)
5. [Architecture](#architecture)
6. [State model and semantics](#state-model-and-semantics)
7. [Privacy and honesty](#privacy-and-honesty)
8. [Testing](#testing)
9. [Limitations and what is still experimental](#limitations-and-what-is-still-experimental)
10. [Deployment](#deployment)
11. [Project layout](#project-layout)

---

## What it is

SE7ENX is a **complete, runnable web application** — not a mockup. It contains:

- a cinematic **opening sequence** (architectural floor plan → 3D room assembling
  itself → cartoon guide);
- a **real 3D digital twin** built with React Three Fiber (walls, window, motorised
  shutter, ceiling light, wall switch, smart plug, furniture, daylight);
- a **single shared simulation state** that every input method writes to, so the
  3D scene, the control panels, the inspector and the event log can never
  disagree;
- a **multilingual command layer** (English, French, Modern Standard Arabic,
  Algerian Darija) with a deterministic parser and a conversational assistant;
- **optional** browser-native speech recognition and **optional** local
  hand-gesture tracking (MediaPipe), both strictly opt-in;
- a **7-step guided tour**, a **device inspector** and an **activity history**;
- a responsive, accessible, monochrome interface that works on desktop and phone.

No account, no API key, no backend, no database, no hardware.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (host `0.0.0.0`, port `5173`) |
| `npm run build` | Type-check (`tsc -b`) + production build into `dist/` |
| `npm run preview` | Serve the production build on port `4173` |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint (flat config), zero warnings allowed |
| `npm test` | Vitest unit tests (engine + parser) |
| `npm run test:e2e` | Playwright browser tests (needs `npx playwright install chromium` once) |

> The dev/preview server sets `server.allowedHosts: true` so the sandbox preview
> host name is accepted. For a public deployment, replace it with an explicit
> host allow-list.

---

## Feature tour

### 1. Opening sequence
A black screen, then white architectural floor-plan lines that draw themselves
across the screen, then the 3D room assembling from outlines into a finished
scene, then the guide's welcome message. **Skip intro** and **Explore the
room** are always available, `Escape` skips, and `prefers-reduced-motion`
collapses the whole sequence instantly.

### 2. Interactive room (3D digital twin)
Drag to orbit, scroll to zoom (polar angle and distance are constrained).
Clickable objects:

| Object | Action |
| --- | --- |
| Ceiling luminaire | toggle the light |
| Wall switch (left wall) | toggle the light |
| Window / shutter | open or close the shutter |
| Smart plug (on the desk) | toggle the plug |
| Desk lamp | follows the smart plug |

If WebGL is unavailable, a **2D schematic fallback** takes over and still
reflects the live state.

### 3. Devices
Ceiling light (on / off / brightness 0–100 %), motorised shutter
(open / close / stop / position 0–100 %), smart plug, ambient daylight level,
room occupancy and a derived simulated temperature.

### 4. Four interaction modes
- **Manual** — the device panel.
- **Voice** — browser-native speech recognition, with an honest disclosure that
  the browser vendor may process audio remotely. Typing always works.
- **Gestures** — MediaPipe hand tracking, entirely on-device.
- **Text** — the assistant panel, always available.

### 5. Conversational assistant
Deterministic answers about the room (who/what/controls/status/gestures/real
building/automation) plus the same command set as every other input method.
It distinguishes **command executed** / **answer** / **not recognised**, and it
never claims that a physical device moved.

### 6. Guided tour
Seven steps that spotlight the real interface controls (guide → room → light
switch → brightness slider → voice mode → gesture mode → shutter). The tour
never turns the camera or microphone on.

### 7. About / platform vision
Explains the idea, the current-vs-future boundary, and where it could go
(homes, hospitality, offices, industrial, KNX / MQTT / local device
platforms) — explicitly labelled as *future* work.

---

## Command reference

The parser is rule-based and recognises the commands below plus common
variations. It is **not** an unrestricted language model.

### English
```
Turn on the light.            Turn off the light.
Set brightness to 45 percent. Open the shutter.
Close the shutter.            Set the shutter to 70 percent.
Stop the shutter.             What is the current light status?
```

### French
```
Allume la lumière.            Éteins la lumière.
Règle la luminosité à 45 pour cent.
Ouvre le volet.               Ferme le volet.      Arrête le volet.
```

### العربية — Modern Standard Arabic
```
شعل الضوء.        طفي الضوء.        خلي الإضاءة 45 بالمئة.
افتح الستارة.     أغلق الستارة.     اوقف الستارة.
```

### الدارجة — Algerian Darija
```
شعل الضو.         طفي الضو.         نقص الضو لـ 45 بالمية.
حلّ الفولي.        سدّ الفولي.        حبس الفولي.
```

Arabic and Darija modes are intentionally forgiving: each accepts the standard
Arabic vocabulary as well, because real Algerian speech mixes the two.
Arabic script switches the whole interface to **RTL**.

### Questions the assistant answers
*Who are you? · What is SE7ENX? · What can I control? · What is the current
light status? · What is the shutter position? · How do hand gestures work? · Is
this connected to a real building? · How does this relate to smart-building
automation?*

Informational questions are matched **before** commands, so asking about the
light can never switch it on.

---

## Architecture

```
src/
  core/            pure, browser-API-free, unit-tested
    types.ts       device + command + event models
    engine.ts      the simulation engine (state machine, shutter kinematics)
    parser.ts      multilingual command parser (EN / FR / AR / DZ)
    assistant.ts   deterministic question answering
    camera.ts      camera session manager (getUserMedia injected, unit-tested)
    i18n.ts        all four languages (typed, compile-time completeness)
  store/app.ts     Zustand store: simulation state + UI state
  three/           React Three Fiber scene
    RoomScene.tsx  canvas, lights, camera rig, WebGL detection
    Room.tsx       room shell, window, door, furniture
    Devices.tsx    ceiling light, shutter, wall switch, smart plug, sensor
    FallbackRoom.tsx  2D schematic fallback
  components/      UI (panels, guide, tour, intro, controls)
    CreatorPhoto.tsx     the creator's real photograph (with a safe fallback)
    CommunityCredit.tsx  community credit block (optional mark + disclaimer)
  hooks/           speech recognition, hand tracking, text-to-speech
tests/
  unit/            Vitest (engine, parser, camera manager, gesture hook)
  e2e/             Playwright (simulation, language, interaction, responsive,
                   camera preview)
```

**The core never imports React, Three.js or any browser API.** That is what
makes the engine testable without a camera, microphone, GPU or backend.

### The camera pipeline

The camera is a **two-track system** and the tracks never block each other:

| track | module | responsibility |
| --- | --- | --- |
| camera | `src/core/camera.ts` (`CameraManager`) | permission → stream → `srcObject` → playback → **first real frames** |
| tracker | `src/hooks/useHandGestures.ts` | MediaPipe model, inference loop, gesture classification |

`CameraManager` takes `getUserMedia` as an injected dependency, so every
failure branch is reachable from a unit test with a mocked media stream. It
reports these phases, and the UI renders each of them honestly:

`idle → requesting → starting → live` (plus `denied`, `unavailable`, `error`)

Rules the implementation guarantees:

- the camera is **never** requested before the user presses *Enable camera*;
- the `<video>` element is **always mounted**, so the stream always has an
  element to attach to (this was the cause of the black preview);
- `srcObject` is assigned, `muted` / `autoplay` / `playsInline` are set, and
  `play()` is awaited — a rejected `play()` is reported, never swallowed;
- the session only becomes *live* when `readyState >= 2` **and**
  `videoWidth > 0` — a granted permission alone is never called “ready”;
- the MediaPipe model loads **after** the frames are available, so a slow
  8 MB download can never delay the preview, and a tracker failure can never
  break it;
- stopping, hiding the tab, unmounting or a fatal error stops every track,
  cancels the animation frame and closes the landmarker;
- a session that is cancelled while the permission prompt is open releases the
  late-arriving stream instead of leaking it.

Diagnostics are written to the browser console as
`[se7enx] camera: phase { phase, failure, readyState, videoWidth, videoHeight, tracks }`.
No frame data, identifiers or personal information is ever logged.

### The 3D scene is state, not decoration
The scene reads `shutter.position` directly and maps it to the geometry of the
slats; the ceiling light intensity and the daylight through the window are
derived from `light.brightness`, `ambient.level` and `shutter.position`. There
is no second source of truth, so a command, a slider, a gesture and a voice
utterance all produce exactly the same result.

---

## State model and semantics

**Light**
- `on = false` → the luminaire is off.
- `brightness = 0` → the luminaire is off (forced).
- Switching the light **off preserves** the last positive brightness, so
  switching it back on restores the previous dimming level.
- `light.brightness = 45` implies the light is on.

**Shutter**
- `0 %` = fully closed, `100 %` = fully open.
- Open / close set a target and the engine animates the real position at
  42 %/s; **Stop** freezes the position mid-travel.
- The scene geometry follows the engine position, so the label can never lie.

**Initial state (also what “Reset simulation” restores)**

| Device | Initial value |
| --- | --- |
| Ceiling light | on, 70 % |
| Smart shutter | 100 % (fully open), stopped |
| Smart plug | on |
| Ambient level | 45 % |
| Room occupancy | occupied |
| Temperature | derived (21.5 °C) |

The temperature and the power draw are **derived** from the other devices, so
they always stay consistent with the scene.

---

## Art direction and the supplied assets

- The **cartoon guide** was drawn from scratch as inline SVG, inspired by the
  creator's photo (round glasses, short beard, dark hair, friendly expression).
  It is an illustration — **not** a photorealistic likeness — and it stays in
  the intro sequence and the guided tour, where it does the talking.
- The creator's **real photograph** (`uploads/meee.jpg`) is used, unchanged, as
  the profile picture: a small round avatar in the intro credit row, a compact
  chip in the guide panel, and the full portrait in the About section
  (`public/creator/abdelkhalek-mammeri.jpg`, 512 px, and a 256 px head crop
  for the avatars). The aspect ratio is preserved, nothing is retouched, and
  the component falls back to the initials if the file cannot be loaded.
- The **community mark** slot (`public/brand/thirduni.png`) is reserved for the
  official Thirduni logo. The file that was supplied in `uploads/` is a
  generic orange “information” placeholder, **not** a Thirduni logo, so it is
  not used: the credit area shows the wording and the disclaimer only, and
  the mark appears automatically as soon as the real file is placed in
  `public/brand/`. Dropping the official file in is all that is needed — no
  code change.
- The About section states explicitly that Thirduni is not a partner of this
  project. No endorsement or partnership is implied.
- The whole interface is monochrome (`#111111` on `#FFFFFF` / `#F7F7F7`), with
  one type scale and a strict spacing rhythm.

## Privacy and honesty

- No accounts, no analytics, no trackers, no backend, no uploads.
- The **camera is never requested** until the visitor presses *Enable camera*;
  the same applies to the microphone.
- Hand tracking runs **locally** in the browser: the MediaPipe model is served
  from `public/models/hand_landmarker.task` and the WASM runtime from
  `public/wasm/`. Video frames are never uploaded and never recorded.
- The camera stream, the MediaPipe worker and the landmarker are released when
  gesture mode stops, when the page becomes hidden, or on any error.
- Gesture recognition uses a **stable-frame requirement (4 frames), a
  confidence threshold (0.6) and a 1.4 s cooldown**, so one pose cannot flood
  the simulation with commands.
- Speech recognition uses the **Web Speech API**. That API does not expose
  whether recognition runs on-device, so the interface states plainly that the
  browser vendor may process audio remotely. Nothing is recorded or stored.
- If speech recognition is missing or the microphone is refused, the text
  assistant does the same job and the failure is reported honestly.
- The interface labels every action as a **virtual** action. No real building
  equipment, KNX bus, MQTT broker, Home Assistant, Shelly, Tuya or PLC is
  connected, and no hardware-control endpoint exists in this codebase.

---

## Testing

### Unit tests (Vitest) — 52 passing

```bash
npm test
```

Covering: light on/off/brightness semantics (including “0 % = off” and
“off preserves the previous level”), shutter open/close/stop/position with the
animation kinematics, plug and occupancy, reset behaviour, event logging with
sources, temperature derivation, inspector snapshots, and the full documented
command set in **English, French, Arabic and Darija**, plus unknown commands,
out-of-range values and question-vs-command disambiguation.

**Camera regression tests** (`tests/unit/camera.test.ts` and
`tests/unit/useHandGestures.test.tsx`, mocked media streams, no camera
needed):

- permission granted → stream attached → *live* only after real frames;
- a stream that never produces frames → `no-frames` failure, tracks released;
- a rejected `video.play()` → `play-rejected` failure, tracks released;
- denied permission → `denied`; missing camera → `unavailable`; busy camera →
  `unavailable`;
- a camera track that ends unexpectedly → `stream-ended`;
- a session cancelled while the permission prompt is open → the late stream is
  released, never leaked;
- a second `start()` never opens a second stream;
- the hand-tracking model failing to load leaves the camera preview running;
- unmounting during the asynchronous initialisation releases the camera;
- stopping releases every track, pauses the element and clears `srcObject`;
- diagnostics report `readyState`, picture size and track states.

### Browser tests (Playwright) — 37 passing

```bash
npx playwright install chromium   # once
npm run test:e2e
```

Covering: intro skip, light toggle + brightness slider, shutter open/close/stop
and reaching an exact position, activity history and its source labels,
inspector, reset, English/French/Arabic/Darija commands, RTL layout, question
handling, unknown commands, out-of-range values, camera-permission denial,
“the camera is never requested automatically”, missing speech API, denied
microphone, guided-tour highlighting and skipping, keyboard operation of the
light switch, reduced motion, mobile layout without horizontal overflow, and
mobile reachability of every essential control.

A dedicated **`gesture` project** runs the camera pipeline for real against
Chromium's synthetic camera: permission → `srcObject` → playback → first
frames → model download from `public/models` → WASM runtime → landmarker →
overlay → *Stop camera* releases the stream. The assertions are about the
**feed itself**: the preview must have a real picture size, and the test
draws one frame into a canvas and checks the average luminance, so a black
rectangle fails the test. A second test aborts the model download and proves
the camera preview survives it. The fake device shows a rolling pattern and
never a hand, so the test asserts the tracker *starts and stays stable* and
reports “No hand detected”; it does **not** claim that a real hand was
recognised.

> **What was *not* tested:** no physical microphone, speaker, camera or building
> equipment was used. Speech recognition and text-to-speech were exercised
> through their browser APIs and their failure paths only; the quality of real
> speech recognition in each of the four languages depends on the browser and
> the operating system and is **not** guaranteed here. The camera used by the
> `gesture` project is **Chromium's synthetic device, not a real webcam**, so
> recognising an actual open palm or closed fist on physical hardware has not
> been verified. The camera *pipeline* (permission, attachment, playback,
> frames, cleanup) was verified end to end against the synthetic device; the
> picture it shows is a test pattern, not a real room.

### Testing the camera manually

1. `npm run dev` and open `http://localhost:5173`.
2. Skip the intro, switch the interaction mode to **Gestures**.
3. The preview frame shows the placeholder *“The camera preview appears here
   once you enable the camera.”* — the camera has **not** been requested yet.
4. Press **Enable camera** and accept the browser prompt.
5. The status line must pass through *“Waiting for camera permission…”* →
   *“Camera starting…”* → *“Camera ready — live preview.”*, and the live
   picture must appear in the frame.
6. A second line reports the tracker: *“Loading the hand-tracking model…”* →
   *“Tracking — show an open palm or a closed fist.”*
7. Open the console: `[se7enx] camera: phase` entries show `readyState`,
   `videoWidth`, `videoHeight` and the track states.
8. **Stop camera** → the status returns to *“Camera off.”*, the picture
   disappears and the green track indicator in the browser toolbar goes out.
9. Reload the page while the camera is running → the browser must show that
   the camera was released.

To check the failure paths, deny the permission (the status must say
*“Camera permission was denied…”* and manual control must keep working),
occupy the camera in another application (*“No camera available, or the camera
is already in use.”*), and open the app on a browser without `getUserMedia`.

---

## Limitations and what is still experimental

- **The command parser is rule-based.** It covers the documented commands and
  common variations, not free-form conversation.
- **Speech recognition quality is browser-dependent.** Chrome, Edge and Safari
  expose the Web Speech API with different language packs; Arabic and Darija
  support in particular varies. The text path always works.
- **Hand tracking** needs a camera, good lighting and a reasonably sized hand.
  It is a demo of the interaction pattern, not a production gesture engine.
- **The Three.js bundle is large** (~680 kB raw, ~176 kB gzipped for `three`
  alone). It is code-split from the app shell; consider lazy-loading the 3D
  stage if you embed this in a page that must stay light.
- **No persistence**: reloading resets the simulation. This is intentional for
  a demo.
- **Real hardware integration is future work.** The intent model (light on,
  brightness, shutter position) is deliberately the same shape a KNX group
  address or an MQTT topic would need, but no adapter is implemented.

---

## Deployment

Any static host works — the build output in `dist/` is fully static.

```bash
npm run build
npm run preview        # local check of the production build
```

Notes:
- `public/models/hand_landmarker.task` (7.8 MB) and `public/wasm/` (22 MB) are
  shipped so that gesture mode works **offline**. If you do not need gesture
  mode, you can delete `public/models/` and `public/wasm/`; the app then falls
  back to the MediaPipe CDN and still degrades gracefully if the CDN is blocked.
- Serve over **HTTPS** (or `localhost`): `getUserMedia` and the Web Speech API
  require a secure context.
- No server-side configuration, no environment variables, no secrets.

---

## Project layout

```
├── index.html
├── vite.config.ts
├── playwright.config.ts
├── eslint.config.js
├── public/
│   ├── favicon.svg
│   ├── models/hand_landmarker.task     # MediaPipe hand model (local)
│   └── wasm/                            # MediaPipe WASM runtime (local)
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css                        # the monochrome design system
│   ├── core/                            # pure domain layer
│   ├── store/                           # Zustand store
│   ├── three/                           # the digital twin
│   ├── components/                      # UI
│   └── hooks/                           # browser integrations
├── tests/unit/                          # Vitest
├── tests/e2e/                           # Playwright
└── scripts/                             # screenshot helpers used during development
```

---

**SE7ENX Simulation — Developed by Abdelkhalek Mammeri for the Thirduni
Community.**
