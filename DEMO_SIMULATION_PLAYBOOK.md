# SankatSahay Controlled Demo Playbook

## 1) System Architecture

### Components
- `Main UI (React/Vite)`: live emergency views (`/dashboard`, `/sos`, `/family`, `/volunteer`, `/admin`).
- `Simulation Control Panel (React page)`: hidden operator console at `/sim-control`.
- `Backend Simulation Engine (Node/Express + Socket.IO)`: deterministic scenario state machine.
- `Mongo-backed domain services`: existing SOS, family, volunteers, resources.

### Runtime Data Flow
1. Control panel emits `simulate:*` commands over Socket.IO and REST fallback.
2. Backend simulation engine updates internal state.
3. Engine broadcasts live state streams:
   - `state:scenario:update`
   - `map:risk:update`
   - `sos:stream:update`
   - `volunteer:demand:update`
   - `panic:index:update`
   - `family:match:update`
   - `admin:kpi:update`
   - `broadcast:alert`
4. Main UI stores updates in Zustand and re-renders map, SOS, volunteer, and reunification panels.

---

## 2) Control Panel Design (UI + Logic)

Route: `/sim-control` (isolated from normal app chrome).

### Controls
- Buttons:
  - `Start Cyclone`
  - `Increase Flood Level`
  - `Trigger Panic Zone`
  - `Reset Demo`
  - `Play Story Mode`
- Sliders:
  - `Disaster intensity (20-100)`
  - `SOS frequency (2-24/min)`
- Toggle:
  - `Simulation Mode ON/OFF`

### Logic
- All controls dispatch Socket.IO command first and REST command second for reliability.
- Live telemetry panel reflects phase, severity, SOS count, panic index, volunteer deficit, and family separation.
- Works offline on LAN/localhost once server is running.

---

## 3) Event Flow (Socket.IO / API)

### Control -> Backend
- `simulate:cyclone`
- `simulate:flood`
- `simulate:panic`
- `simulate:reset`
- `simulate:config:update`
- `simulate:story:play`

REST equivalents:
- `POST /api/simulation/command`
- `GET /api/simulation/state`

Security:
- `x-sim-key` (or `?key=`) validated with `SIMULATION_KEY`.

### Backend -> Frontend
- Scenario state: `state:scenario:update`
- Map layers: `map:risk:update`
- SOS stream: `sos:stream:update`
- Volunteer allocation: `volunteer:demand:update`
- Panic adaptation: `panic:index:update`
- Reunification updates: `family:match:update`
- Admin KPIs: `admin:kpi:update`
- Broadcast rail: `broadcast:alert`

---

## 4) Sample JSON Payloads

```json
{
  "command": "simulate:cyclone",
  "payload": {
    "phase": 1,
    "intensity": 72,
    "windSpeedKmph": 138,
    "sosFrequency": 9
  }
}
```

```json
{
  "command": "simulate:flood",
  "payload": {
    "phase": 2,
    "waterLevelMeters": 2.4,
    "intensity": 81,
    "sosFrequency": 14
  }
}
```

```json
{
  "command": "simulate:panic",
  "payload": {
    "phase": 3,
    "panicIndex": 88,
    "zoneId": "zone-cuttack-core",
    "intensity": 92
  }
}
```

```json
{
  "event": "volunteer:demand:update",
  "phase": 3,
  "demand": {
    "required": 72,
    "assigned": 32,
    "medicsNeeded": 24,
    "boatsNeeded": 14,
    "searchTeamsNeeded": 12
  }
}
```

---

## 5) Demo Story Flow (Stage Sequence)

1. `Start Cyclone`  
   Map coastal rings go amber/red, broadcast starts, early SOS wave appears.

2. `Increase Flood Level`  
   Floodplain risk circles expand, SOS density increases, resource shortages climb.

3. `Trigger Panic Zone`  
   Panic index spikes, SOS page activates panic-friendly UI + breathing protocol.

4. Family Reunification moment  
   QR identity + simulated face confidence updates appear in family dashboard.

5. Volunteer Allocation closure  
   Assignment stream shows responders matched by logic score; admin KPIs stabilize.

Use `Play Story Mode` for timed auto-sequence during judge demos.

---

## 6) UI Design System (Original Command-Center Identity)

### Typography
- Primary: `Rajdhani` (operational, compressed, authoritative).
- Heading/Broadcast: `Saira Semi Condensed`.
- Data layer: `IBM Plex Mono`.

### Severity Color Logic
- `SAFE`: deep green.
- `WATCH`: burnt amber.
- `HIGH`: burnt orange-red.
- `CRITICAL`: dark emergency red.
- `PANIC`: flashing signal red over maroon background.

### Motion Principles
- Pulsing SOS rings.
- Radar breathing for active zones.
- Broadcast banner glow.
- Panic mode reduces clutter and emphasizes large actions.

### Layout Philosophy
- Tactical map is primary canvas.
- Side rails hold phase telemetry, demand, and shortages.
- Top broadcast strip behaves like emergency command ticker.
- Control panel uses modular command blocks, not generic dashboard cards.

---

## 7) Visual Differentiators for Hackathon Impact

- Hidden operator control panel driving entire narrative in real-time.
- Phase-dependent UI adaptation (normal -> flood escalation -> panic simplified).
- Deterministic seeded simulation for repeatable judge demos.
- Live assignment score transparency (distance, skill, load).
- Human-centered closure: family separation/reunification metrics update under stress.

