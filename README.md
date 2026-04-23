# SankatSahay - AI-Powered Disaster Response Platform

SankatSahay is a emergency response web platform built with a MERN architecture for global hackathon demos and real-world scale-up.

## Stack

- Frontend: React 18, Vite, Tailwind, Framer Motion, Leaflet, Socket.io client, i18next
- Backend: Node.js, Express, MongoDB, Mongoose, Socket.io, JWT, Twilio, Nodemailer, node-cron
- AI: NVIDIA-hosted OpenAI-compatible endpoint (`openai/gpt-oss-120b`)

## Quick Start

1. Copy `server/.env.example` to `server/.env` and fill credentials.
2. Install dependencies.
3. Seed demo data.
4. Start app.

Windows users can also double-click `run.bat` from the project root to install missing dependencies and launch the app.

```bash
npm install
npm run seed -w server
npm run dev
```

## Demo Credentials

- Admin: admin@sankatsahay.in / NEXORA2025
- User: demo@user.in / demo123

## Priority Demo Routes

- `/sos` - Silent SOS, voice trigger, panic reversal
- `/dashboard` - Live risk and SOS map
- `/family` - Family dashboard and QR identity card
- `/demo` - Quick judge flow bootstrap
- `/sim-control` - Hidden disaster simulation control panel (operator tool)

## Controlled Simulation

Use the simulation panel to run the unified scenario:
1. Cyclone impact
2. Flood escalation
3. Panic and family separation

Key env vars:
- `SIMULATION_KEY` for control panel command auth
- `SIM_CONTROL_URL` for control panel CORS origin

Detailed implementation notes are in `DEMO_SIMULATION_PLAYBOOK.md`.
