# SatuSatu: Micro-Mission Decomposer & Cognitive Support for ADHD

**Description**  
SatuSatu is a web and AI-powered tool that helps neurodivergent users (ADHD, Autism, Anxiety, Chronic Procrastination) break down cognitive clutter and chaos (messy rooms, overwhelming thoughts) into clear, actionable micro-missions. The app supports Indonesian language and empathetic guidance.

## Key Features

- **Text Vent Processing:** Converts free-form text venting (brain dump) into step-by-step, low-stress, actionable tasks.
- **Visual Decompression:** Users upload a photo of a messy environment—AI identifies key items to tidy first and generates achievable steps.
- **Audio Decompression:** Records voice venting, transcribes and summarizes the anxiety/noise, and provides prioritized actions.
- **Empathetic Interface:** All prompts and instructions are supportive, warm, and judgment-free (suitable for mental health, ADHD, Autism).
- **Body Doubling (AI Coach):** Built-in focus timer and real-time audio motivation, based on clinical body doubling principles.
- **Streak Tracking:** Rewards and visual encouragement for each completed mission.

## How It Works

1. **Select Input:** Choose text, audio, or image mode to brain dump or capture your current cognitive load.
2. **Decompression:** SatuSatu sends your input to a backend AI (Gemini) for analysis and task breakdown.
3. **Micro Missions:** Get a personalized set of actionable, manageable steps, displayed one at a time.
4. **Progress & Motivation:** Mark tasks as done and receive affirmations, audio cues, and confetti celebrations.
5. **Focus Support:** Companion mode helps you stay on-task with customizable focus intervals and breathing guidance.

## Tech Stack

- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **Backend/AI:** Google Gemini, RESTful APIs (see `.env.example` for key)
- **Audio/Visual:** Uses browser APIs for media input and Web Audio for sound feedback

## Getting Started

**Requirements:**  
- Node.js

**Setup:**
```bash
npm install
```

**Configure Environment Variables:**  
Create a `.env.local` file based on `.env.example`.
- Make sure `GEMINI_API_KEY` is set (required for AI features).

**Run the app locally:**
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

- `src/App.tsx` — Main entrypoint and UI routing
- `src/types.ts` — TypeScript types and interfaces (`TaskMission`, etc.)
- `public/` and `src/assets/` — Images and static files
- `server.ts` (if present) — API logic and Gemini integration

## NPM Scripts

- `npm run dev` — Local development mode
- `npm run build` — Build for production
- `npm run start` — Run production build
- `npm run lint` — Type checking

## Environment Variables

See `.env.example` for required keys:
- `GEMINI_API_KEY` — Google Gemini API key for all AI features

## Contributing

Contributions and accessibility/UX improvements are always welcome. Please open an issue or PR.

**License:** MIT  
**Author:** [kuzanf3b](https://github.com/kuzanf3b)
