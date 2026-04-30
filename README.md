# 🚨 SankatSahay — AI-Powered Disaster Response Platform

SankatSahay is a real-time AI-driven disaster response system designed to **reduce emergency response time** during high-impact events like cyclones, floods, and mass panic situations.

Built for global-scale hackathons and real-world deployment, it combines **AI intelligence, simulation, and live coordination** into a single command platform.

---

## 🌍 Live Demo

🔗 Frontend: https://sankatsahay-client.vercel.app  
🔗 Backend API: https://sankatsahay.onrender.com/api

---

## ⚡ Core Demo Flow (Judge Walkthrough)

1. 🌪️ Disaster Simulation Starts  
2. 📍 SOS signals detected in real-time  
3. 🧠 AI detects panic patterns and risk zones  
4. 👥 Volunteers auto-assigned (skill + proximity)  
5. 🗺️ Safe route generated with ETA

👉 Entire flow executes in **~20–30 seconds** for live demo.

---

## 🔥 Key Features

### 🆘 Intelligent SOS System
- Tap SOS, Silent SOS, Voice-triggered SOS
- Real-time clustering of distress signals
- Panic detection using AI

### 🧠 AI Decision Engine
- Predicts resource needs (food, medical, rescue)
- Explains decisions (AI transparency panel)
- Detects panic index from user behavior

### 👥 Smart Volunteer Coordination
- Auto-assignment based on:
  - Distance
  - Skills
  - Trust score
- Real-time task tracking

### 🗺️ Emergency Routing
- Flood-aware safe route generation
- ETA calculation
- Dynamic rerouting

### 👨‍👩‍👧 Family Reunification
- QR-based identity system
- Face match (demo-safe, no biometric storage)
- Missing person tracking

### 🎮 Disaster Simulation Engine
- Cyclone → Flood → Panic → Response lifecycle
- Fully controllable admin panel
- Reliable demo fallback (works even if backend fails)

---

## 🧑‍💻 Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS + Framer Motion
- Leaflet (Maps)
- Socket.io client
- i18next (multi-language)

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io (real-time)
- node-cron (AI jobs)

**AI Layer**
- OpenAI-compatible endpoint (`gpt-oss-120b`)
- Custom decision + prediction services

---

## 🧪 Demo Credentials

Admin:  
`admin@sankatsahay.in` / `NEXORA2025`

User:  
`demo@user.in` / `demo123`

---

## 📌 Important Routes

| Route | Description |
|------|------------|
| `/sos` | Trigger SOS (tap / silent / voice) |
| `/dashboard` | Live disaster map |
| `/family` | Family tracking & QR |
| `/admin` | Full control panel |
| `/demo` | Quick demo entry |

---

## ⚙️ Quick Start (Local)

```bash
npm install
npm run seed -w server
npm run dev
```

---

## 🎯 Why SankatSahay?

- ⏱️ Reduces coordination delay (~40% in simulation)
- 🤖 AI-driven decision making
- ⚡ Real-time response system
- 🧩 Fully integrated workflow (no manual gaps)
- 🌍 Built for real-world scalability

---

## 🔐 Notes

- No biometric data is stored
- Face data processed locally (demo-safe)
- System includes fallback mode for reliability during demos

---

## 📄 Documentation

Detailed flow and simulation logic:

👉 `DEMO_SIMULATION_PLAYBOOK.md`

---

## 👨‍💻 Contributors

- Brijesh Kumar Mohanty
- Sweta Rajshree
- Sakshi Rani
- Ayushman Mishra

---

## ⭐ Final Note

SankatSahay is not just a prototype —  
it is a **complete emergency command system** designed to **save lives through faster, smarter response.**
