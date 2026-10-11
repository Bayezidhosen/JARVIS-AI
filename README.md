# JARVIS AI — Personal Voice Agent

An intelligent, voice-controlled personal AI assistant named **JARVIS AI** supporting **Bangla (বাংলা)**, **English**, and **Banglish** (Bengali written in English alphabet) with real-time speech recognition, natural audio voice responses, futuristic Arc Reactor orb waveforms, dynamic tool execution, note/task management, scheduling, and neural memory.

---

## 🌟 Key Features

1. **Natural Voice Interaction & Interruption:**
   - Real-time speech recognition via Web Speech API with multilingual recognition (`auto`, `bn-BD`, `en-US`).
   - Seamless interruptibility: tap the Arc Reactor Orb or click "Interrupt" to halt speech playback instantly.
   - Dual TTS engine: Server-side high-fidelity Gemini Neural TTS (`gemini-3.8-flash-lite-tts`) and instant browser `SpeechSynthesis`.
   - Real-time live audio visualizer driven by microphone stream or harmonic frequencies.

2. **Multilingual AI Brain (Gemini 3.8 Flash):**
   - Natively understands Bengali (`বাংলা`), Banglish (`"Hey Jarvis, YouTube open koro"`), and English (`"Jarvis, schedule a meeting"`).
   - Context-aware conversation memory with automatic language detection.
   - Asks for clarification when commands are ambiguous, and never hallucinates task completion.

3. **Autonomous Tool & Command Execution Engine:**
   - **Web Navigation:** Opens YouTube, Google, GitHub, Gmail, and custom URLs in real-time.
   - **Web Search:** Directly triggers Google searches for requested tutorials, queries, or topics.
   - **Date & Time:** Real-time clock and calendar reporting.
   - **Live Weather:** Fetches live weather conditions, temperature, humidity, and forecasts.
   - **Notes & Task Organizer:** Voice-activated note creation, pinned items, categorization, and deletion.
   - **Reminders & Schedule:** Sets reminders with dates, times, and priority alerts.
   - **Message & Email Drafter:** Drafts emails and messages with mailto link generation.
   - **Desktop Agent Bridge:** Safe integration bridge for opening authorized local apps (VS Code, Terminal, Spotify, Calculator, File Explorer).
   - **Neural Memory:** Retains user personal facts, preferred stack, name, and preferences across sessions.

4. **Security & Permission Safeguards:**
   - Allowlist-based tool invocation architecture.
   - Authorization Confirmation Modal for consequential actions (deleting notes, executing terminal commands, wiping context).
   - Comprehensive audit activity log tracking every executed tool and its output.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm
- A Gemini API key (from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API Key in `.env`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   PORT=3000
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in Google Chrome or Microsoft Edge (recommended for Web Speech API microphone support).

4. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 🎙️ Sample Voice & Text Commands

| Language | Example Command | What JARVIS Does |
|---|---|---|
| **Banglish** | `"Hey Jarvis, YouTube open koro."` | Opens YouTube in a new tab with audio confirmation. |
| **Banglish** | `"Ajker weather bolo."` | Fetches live weather forecast and temperature. |
| **Banglish** | `"Amar jonno ekta portfolio website er code lekho."` | Generates modern React & Tailwind portfolio code. |
| **Banglish** | `"Amake kal shokal 9 tay reminder dio."` | Schedules a reminder in the Reminders tab. |
| **Banglish** | `"Google e React tutorial search koro."` | Launches Google search for React tutorial. |
| **বাংলা** | `"আজকের তারিখ ও সময় কত?"` | Speaks current date and time in Bengali. |
| **English** | `"Jarvis, create a note to review pull requests tomorrow."` | Adds note to the Notes & Tasks workspace. |
| **English** | `"Draft an email to Alex about the product roadmap."` | Prepares email draft with subject and body. |
| **English** | `"Remember that I prefer TypeScript and React."` | Stores in Neural Memory for future answers. |

---

## 🛡️ Architecture & Security
- **Server:** Node.js Express server mounting Vite in development, hosting secure endpoints (`/api/chat`, `/api/tts`, `/api/weather`, `/api/desktop-agent`).
- **AI Model:** `gemini-3.8-flash` with function declarations for structured tool-calling.
- **Audio Output:** `gemini-3.8-flash-lite-tts` for single-speaker natural voice.
- **Microphone:** Web Speech API + Web Audio API Analyser for real-time frequency waveforms.
- **Privacy:** Client secrets and API keys are strictly server-side and never exposed to browser bundles.
