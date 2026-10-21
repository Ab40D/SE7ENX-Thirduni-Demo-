# SE7ENX — Open Smart Building Lab

**A Human-to-Building Interaction Platform Prototype**  
Created by **Abdelkhalek Mammeri** for the **Thirduni Community**.

[Main Demo Video](https://www.youtube.com/watch?v=jmIqzMuaxs8&t=7s) · [GitHub Repository](https://github.com/Ab40D/SE7ENX-Thirduni-Demo-)

---

## Overview

What if interacting with a building felt as natural as interacting with a person?

SE7ENX explores this question through an interactive smart-building prototype that combines a 3D room interface, graphical controls, voice commands, and hand gestures.

The project aims to make building interaction more intuitive and accessible, reducing the need for users to navigate complex control panels or understand the technical details behind building automation.

**Open Smart Building Lab** represents the broader vision: an open, experimental environment for exploring how people can interact with smart spaces through natural interfaces, visual feedback, and, in future iterations, interoperable building technologies.

Developed for the Thirduni Community, this prototype demonstrates the concept and invites feedback from developers, students, and building-automation practitioners.

## The Problem

Smart buildings can offer sophisticated automation, but interacting with them may require dedicated applications, specialised interfaces, or familiarity with the underlying systems.

This creates an accessibility and usability challenge for everyday users.

SE7ENX explores an alternative: a unified interaction layer where users can understand a room visually and interact with its devices through familiar methods, including graphical controls, voice, and gestures.

## The Solution

SE7ENX combines a browser-based 3D room with simulated smart devices and multiple interaction methods.

The prototype explores:

- **3D visualisation:** interact with a virtual room and its devices.
- **Voice interaction:** issue supported commands through compatible browser speech-recognition functionality.
- **Hand gestures:** explore hands-free control using camera-based hand tracking.
- **Multilingual interaction:** support interface and command patterns across English, French, Arabic, and Algerian Darija.
- **Responsive design:** make the experience accessible across different screen sizes.
- **A foundation for interoperability:** investigate how a unified interface could eventually connect different building-automation technologies.

## Project Demonstrations

The following videos provide a view of the project and related community demonstrations.

### 1. Creator's Demonstration

[Watch on YouTube](https://www.youtube.com/watch?v=jmIqzMuaxs8&t=7s)

The main walkthrough by Abdelkhalek Mammeri, presenting the SE7ENX concept and its interactive experience.

### 2. Community Demonstration — Hichem Computer

[Watch on TikTok](https://www.tiktok.com/@hichem.computer/video/7697346508127096072)

A community-shared demonstration related to another version of the project.

### 3. KNX Training Community — Itqan Smart

[Watch on TikTok](https://www.tiktok.com/@itqan_smart/video/7697198593609878802)

A demonstration shared by Itqan Smart, a KNX training centre, related to the project.

These videos are provided for demonstration and community context. Their inclusion does not imply a formal partnership, sponsorship, certification, or endorsement.

## Current Prototype Capabilities

### Interactive 3D Environment

The application uses a browser-based 3D scene to represent a smart room and its virtual devices. Users can explore the environment and interact with supported controls.

### Voice Commands

The prototype explores voice-based interaction through browser speech-recognition capabilities where supported. Available functionality depends on the browser and its configuration.

### Hand-Gesture Interaction

Camera-based hand tracking provides an experimental hands-free interaction method. Camera permission is required, and results may vary with lighting, camera quality, and hand visibility.

### Simulated Smart Devices

The interface represents smart-building devices such as lights, dimmers, shutters, and smart plugs. The displayed states are intended to demonstrate the interaction model.

### Multilingual Interface

The project explores English, French, Arabic, and Algerian Darija interaction patterns, including right-to-left interface support for Arabic.

## Important Limitations

**This release is an experimental prototype, not a production building-management system.**

- Device states in this demo are simulated.
- This version does not directly control physical building devices.
- KNX, Home Assistant, Shelly, Tuya, MQTT, Node-RED, PLC, and SCADA integrations are not claimed as working features of this particular demo.
- Voice recognition and camera-based interaction depend on browser support, permissions, and the relevant processing environment.
- The application must not be used for safety-critical operations, security systems, alarms, or real building control.

The purpose of this release is to demonstrate the concept clearly and provide a foundation for further development.

## Technology Stack

The prototype uses web technologies and browser-based interaction tools, including:

- **React** — user interface
- **TypeScript** — application logic and type safety
- **Vite** — development and build tooling
- **Three.js** — 3D rendering
- **React Three Fiber** — integration of 3D scenes with React
- **Zustand** — client-side state management
- **MediaPipe** — hand-tracking integration
- **Web Speech API** — browser speech-recognition functionality where supported

Testing tools and additional dependencies should be verified against the current repository configuration.

## Run Locally

### Requirements

- Git
- Node.js and npm
- A modern web browser

Check your installation:

\`\`\`bash
node --version
npm --version
git --version
\`\`\`

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/Ab40D/SE7ENX-Thirduni-Demo-.git
cd SE7ENX-Thirduni-Demo-
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Start the development server

\`\`\`bash
npm run dev
\`\`\`

Open the local URL displayed in your terminal.

### 4. Explore the application

1. Explore the virtual room and available device controls.
2. Try the supported interaction methods.
3. Switch languages and explore the interface.
4. Grant camera permission only if you want to test gesture interaction.
5. Test voice interaction if your browser supports it.

For camera and microphone access, modern browsers generally require HTTPS on hosted websites; localhost is normally treated as a secure context.

**Note:** Available commands and scripts may vary by repository version. Consult `package.json` if a command is unavailable.

## The Vision: Open Smart Building Lab

SE7ENX is an initial step toward a broader goal: making smart environments easier to understand, configure, and interact with.

The long-term direction is to investigate a common interaction layer that could connect people with different types of smart spaces without forcing them to learn a different interface for every device or protocol.

Potential research directions include:

- Configurable digital twins of rooms and buildings.
- More reliable voice and gesture interaction.
- Mobile-friendly and accessible interfaces.
- Local-first operation and privacy-conscious system design.
- Interoperability with selected building-automation platforms.
- Explicit permissions, verified device states, and safe command execution.
- Tools for developers and learners to experiment with smart-building concepts.

These are future directions, not claims about capabilities already implemented in this release.

## Next Three Months

If development continues, the planned priorities are:

1. Improve the interface, onboarding, accessibility, and mobile experience.
2. Make virtual rooms and simulated devices easier to configure.
3. Improve interaction reliability and expand automated testing.
4. Document supported commands and clearly distinguish simulated from real device states.
5. Research a secure, local-first integration architecture for selected building-automation technologies.
6. Collect feedback from the Thirduni Community and building-automation practitioners to guide future development.

Any future connection to physical devices will require dedicated integration work, explicit configuration, testing, and 

appropriate safety controls.



## Live Demos — Try SE7ENX in Your Browser

SE7ENX is available through the following hosted demonstrations. You can open them directly in your browser without cloning the repository.

### 1. SE7ENX — Vercel Demo

**[Open SE7ENX on Vercel](https://se-7-enx-thirduni-demo.vercel.app/)**

The first hosted entry point for exploring the project. Some interactive features, particularly camera-dependent gesture recognition, may work better when running the application locally.

### 2. SE7ENX — Railway Demo

**[Launch the SE7ENX Experience](https://se7enx-thirduni-demo-production.up.railway.app/)**

For the recommended hosted experience, open this version in the latest version of **Google Chrome on a desktop or laptop**. Where supported, try voice commands and hand gestures to explore the interaction concept.

When prompted, allow camera and microphone access if you want to test these features. If permission was previously blocked, update the site's permissions in Chrome and reload the page.

For the best opportunity to test camera-based interaction, use the local setup described in [Run Locally](#run-locally). Local execution can help avoid some deployment-related limitations, although browser permissions and hardware compatibility still apply.

### 3. Community Demo — SE7ENXHS

**[Open the SE7ENXHS Demo](https://se7enxhs-production.up.railway.app/)**

This is a separate demonstration created by a friend, showcasing another experience related to the SE7ENX concept. It is provided as an additional community reference and is distinct from the main SE7ENX demo.

### Recommended Testing Steps

1. Start with the [Railway demo](https://se7enx-thirduni-demo-production.up.railway.app/).
2. Use an up-to-date version of Google Chrome.
3. Explore the room and interact with the virtual devices.
4. Grant camera and microphone permissions when requested.
5. Test voice commands and hand gestures where supported.
6. If camera-based interaction does not work reliably online, follow the local installation instructions above.
7. Explore the [Vercel version](https://se-7-enx-thirduni-demo.vercel.app/) and the [SE7ENXHS community demo](https://se7enxhs-production.up.railway.app/) for comparison.

**Hosting note:** These demos run on third-party hosting services and may be affected by resource limits, availability, or free-tier restrictions. Continued public access depends on the hosting providers' policies and available resources. If a hosted version is unavailable, use the repository to run the project locally.

**Privacy and safety:** Camera and microphone access is controlled by your browser. Only grant permissions when you intend to test those features. The current prototype is experimental; do not use it to control safety-critical systems or assume that simulated device states represent real physical devices.


## Creator

**Abdelkhalek Mammeri**  
Creator and developer of SE7ENX.

- GitHub: [Ab40D](https://github.com/Ab40D)
- LinkedIn: [Abdelkhalek Mammeri](https://www.linkedin.com/in/abdelkhalekmammeri/)
- Portfolio: [SE7ENX](https://se7en-bay.vercel.app/)

The project brings together interests in building automation, human-computer interaction, 3D visualisation, and intelligent environments.

## Acknowledgements

Thanks to the Thirduni Community, the open-source communities behind the technologies used in this prototype, and the people who shared demonstrations and feedback.

## License

Check the repository for a `LICENSE` file. If no license is present, the code is not automatically licensed for reuse simply because the repository is public.

---

**SE7ENX — Open Smart Building Lab**  
*Exploring a more natural way for people to interact with buildings.*

Created by Abdelkhalek Mammeri for the Thirduni Community.
