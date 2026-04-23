const SCENARIO_ID = "cyclone-flood-panic-india-01";
const DEMO_MODE = true;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeSeverity(intensity) {
  if (intensity >= 85) return "PANIC";
  if (intensity >= 70) return "CRITICAL";
  if (intensity >= 50) return "HIGH";
  if (intensity >= 30) return "WATCH";
  return "SAFE";
}

function makeBaseZones() {
  return [
    {
      id: "zone-odisha-coast",
      name: "Odisha Coastal Belt",
      kind: "coastal",
      center: [20.24, 86.65],
      radiusMeters: 14000,
      severity: "WATCH",
      color: "#A56A00",
      intensity: 35,
      blink: false
    },
    {
      id: "zone-kolkata-basin",
      name: "Kolkata Flood Basin",
      kind: "floodplain",
      center: [22.56, 88.35],
      radiusMeters: 12000,
      severity: "SAFE",
      color: "#1F3B2D",
      intensity: 20,
      blink: false
    },
    {
      id: "zone-cuttack-core",
      name: "Cuttack Urban Core",
      kind: "urban",
      center: [20.47, 85.88],
      radiusMeters: 8000,
      severity: "SAFE",
      color: "#1F3B2D",
      intensity: 18,
      blink: false
    }
  ];
}

function makeBaseState() {
  return {
    scenarioId: SCENARIO_ID,
    phase: 0,
    simMode: false,
    intensity: 35,
    sosFrequency: 6,
    floodLevel: 0.2,
    panicIndex: 8,
    severity: "WATCH",
    activeZone: "zone-odisha-coast",
    generated: {
      sosCounter: 0,
      assignmentCounter: 0
    },
    zones: makeBaseZones(),
    sosStream: [],
    volunteerAssignments: [],
    volunteerDemand: {
      required: 16,
      assigned: 8,
      medicsNeeded: 5,
      boatsNeeded: 2,
      searchTeamsNeeded: 3
    },
    familyStatus: {
      separatedCount: 2,
      reunitedCount: 0,
      latestMatch: null
    },
    panic: {
      active: false,
      zoneId: null,
      breathingPrompt: false
    },
    resources: {
      foodShortagePercent: 8,
      medicalShortagePercent: 10,
      shelterOccupancyPercent: 52
    },
    adminKpi: {
      activeSOS: 4,
      volunteerDeficit: 8,
      avgResponseMinutes: 12,
      panicAlerts: 0
    },
    broadcast: "Simulation standby. Awaiting operator command.",
    timestamp: new Date().toISOString()
  };
}

class SimulationEngine {
  constructor() {
    this.state = makeBaseState();
    this.io = null;
    this.timer = null;
    this.seed = 20260423;
    this.storyTimer = null;
  }

  attach(io) {
    this.io = io;
  }

  nextRand() {
    this.seed = (1664525 * this.seed + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  now() {
    return new Date().toISOString();
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  updateTimestamp() {
    this.state.timestamp = this.now();
  }

  setZoneStyle(zone, intensity, blink = false) {
    const severity = normalizeSeverity(intensity);
    const colorMap = {
      SAFE: "#1F3B2D",
      WATCH: "#A56A00",
      HIGH: "#C4451C",
      CRITICAL: "#8E1111",
      PANIC: "#FF3B30"
    };

    zone.intensity = intensity;
    zone.severity = severity;
    zone.color = colorMap[severity];
    zone.blink = blink;
  }

  applyCyclone(payload = {}) {
    this.state.phase = 1;
    this.state.simMode = true;
    this.state.intensity = clamp(payload.intensity ?? 68, 0, 100);
    this.state.severity = normalizeSeverity(this.state.intensity);
    this.state.activeZone = "zone-odisha-coast";
    this.state.floodLevel = Math.max(this.state.floodLevel, 0.6);
    this.state.panicIndex = clamp(this.state.panicIndex, 5, 30);
    this.state.broadcast = "Phase 1: Cyclone impact - high wind corridor confirmed along Odisha coast.";

    this.state.zones.forEach((zone) => {
      if (zone.id === "zone-odisha-coast") this.setZoneStyle(zone, this.state.intensity + 8, true);
      if (zone.id === "zone-kolkata-basin") this.setZoneStyle(zone, 42);
      if (zone.id === "zone-cuttack-core") this.setZoneStyle(zone, 48);
    });

    this.state.resources.shelterOccupancyPercent = 64;
    this.state.resources.foodShortagePercent = 14;
    this.state.volunteerDemand = {
      required: 26,
      assigned: 14,
      medicsNeeded: 7,
      boatsNeeded: 5,
      searchTeamsNeeded: 4
    };
    this.state.adminKpi.activeSOS = Math.max(this.state.adminKpi.activeSOS, 10);
    this.state.adminKpi.volunteerDeficit = this.state.volunteerDemand.required - this.state.volunteerDemand.assigned;
    this.updateTimestamp();
    this.emitAll("simulate:cyclone");
  }

  applyFlood(payload = {}) {
    this.state.phase = 2;
    this.state.simMode = true;
    this.state.floodLevel = clamp(payload.waterLevelMeters ?? this.state.floodLevel + 0.8, 0, 5);
    this.state.intensity = clamp(payload.intensity ?? this.state.intensity + 12, 0, 100);
    this.state.sosFrequency = clamp(payload.sosFrequency ?? this.state.sosFrequency + 4, 1, 30);
    this.state.severity = normalizeSeverity(this.state.intensity);
    this.state.activeZone = "zone-kolkata-basin";
    this.state.broadcast = "Phase 2: Flood escalation - water levels rising and distress calls surging.";

    this.state.zones.forEach((zone) => {
      if (zone.id === "zone-kolkata-basin") this.setZoneStyle(zone, this.state.intensity + 6, true);
      if (zone.id === "zone-odisha-coast") this.setZoneStyle(zone, this.state.intensity - 8);
      if (zone.id === "zone-cuttack-core") this.setZoneStyle(zone, this.state.intensity - 2, true);
    });

    this.state.resources = {
      foodShortagePercent: clamp(this.state.resources.foodShortagePercent + 18, 0, 100),
      medicalShortagePercent: clamp(this.state.resources.medicalShortagePercent + 24, 0, 100),
      shelterOccupancyPercent: clamp(this.state.resources.shelterOccupancyPercent + 20, 0, 100)
    };
    this.state.volunteerDemand = {
      required: 48,
      assigned: 22,
      medicsNeeded: 16,
      boatsNeeded: 11,
      searchTeamsNeeded: 8
    };
    this.state.adminKpi.activeSOS = Math.max(this.state.adminKpi.activeSOS, 24);
    this.state.adminKpi.avgResponseMinutes = 16;
    this.state.adminKpi.volunteerDeficit = this.state.volunteerDemand.required - this.state.volunteerDemand.assigned;
    this.updateTimestamp();
    this.emitAll("simulate:flood");
  }

  applyPanic(payload = {}) {
    this.state.phase = 3;
    this.state.simMode = true;
    this.state.panicIndex = clamp(payload.panicIndex ?? 86, 0, 100);
    this.state.intensity = clamp(payload.intensity ?? Math.max(this.state.intensity, 86), 0, 100);
    this.state.severity = normalizeSeverity(this.state.intensity);
    this.state.activeZone = payload.zoneId || "zone-cuttack-core";
    this.state.panic = {
      active: true,
      zoneId: this.state.activeZone,
      breathingPrompt: true
    };
    this.state.broadcast = "Phase 3: Panic and separation - emotional distress rising, reunification priority elevated.";

    this.state.zones.forEach((zone) => {
      if (zone.id === this.state.activeZone) this.setZoneStyle(zone, 96, true);
    });
    this.state.familyStatus.separatedCount = Math.max(this.state.familyStatus.separatedCount, 14);
    this.state.adminKpi.panicAlerts = this.state.adminKpi.panicAlerts + 6;
    this.state.adminKpi.activeSOS = Math.max(this.state.adminKpi.activeSOS, 36);
    this.state.volunteerDemand = {
      required: 72,
      assigned: 32,
      medicsNeeded: 24,
      boatsNeeded: 14,
      searchTeamsNeeded: 12
    };
    this.state.adminKpi.volunteerDeficit = this.state.volunteerDemand.required - this.state.volunteerDemand.assigned;
    this.updateTimestamp();
    this.emitAll("simulate:panic");
  }

  applyReset() {
    this.clearStoryTimer();
    this.state = makeBaseState();
    this.emitAll("simulate:reset");
  }

  updateConfig(payload = {}) {
    if (typeof payload.simMode === "boolean") {
      this.state.simMode = payload.simMode;
    }
    if (typeof payload.intensity === "number") {
      this.state.intensity = clamp(payload.intensity, 0, 100);
      this.state.severity = normalizeSeverity(this.state.intensity);
    }
    if (typeof payload.sosFrequency === "number") {
      this.state.sosFrequency = clamp(payload.sosFrequency, 1, 30);
    }
    this.state.broadcast = this.state.simMode ? "Simulation mode active." : "Simulation mode paused.";
    this.updateTimestamp();
    this.emitAll("simulate:config:update");
  }

  generateSOSBurst() {
    const activeZone = this.state.zones.find((z) => z.id === this.state.activeZone) || this.state.zones[0];
    const bursts = clamp(Math.round(this.state.sosFrequency / 5 + this.nextRand() * 2), 1, 8);
    const created = [];

    for (let i = 0; i < bursts; i += 1) {
      this.state.generated.sosCounter += 1;
      const latJitter = (this.nextRand() - 0.5) * 0.12;
      const lngJitter = (this.nextRand() - 0.5) * 0.12;
      const modePool = this.state.phase >= 3 ? ["silent", "voice", "tap", "silent"] : ["tap", "voice", "silent"];
      const mode = modePool[Math.floor(this.nextRand() * modePool.length)];
      const sos = {
        id: `sim-sos-${this.state.generated.sosCounter}`,
        lat: Number((activeZone.center[0] + latJitter).toFixed(5)),
        lng: Number((activeZone.center[1] + lngJitter).toFixed(5)),
        mode,
        phase: this.state.phase,
        status: "active",
        urgency: this.state.phase >= 3 ? "critical" : this.state.phase >= 2 ? "high" : "watch",
        createdAt: this.now()
      };
      created.push(sos);
    }

    this.state.sosStream = [...created, ...this.state.sosStream].slice(0, 40);
    this.state.adminKpi.activeSOS = clamp(this.state.adminKpi.activeSOS + created.length, 0, 999);
    return created;
  }

  runVolunteerAllocation() {
    const nextAssigned = clamp(
      this.state.volunteerDemand.assigned + Math.round(1 + this.nextRand() * 3),
      0,
      this.state.volunteerDemand.required
    );
    this.state.volunteerDemand.assigned = nextAssigned;
    this.state.adminKpi.volunteerDeficit = this.state.volunteerDemand.required - this.state.volunteerDemand.assigned;

    this.state.generated.assignmentCounter += 1;
    const assignment = {
      id: `sim-assignment-${this.state.generated.assignmentCounter}`,
      volunteerTag: `V-${100 + this.state.generated.assignmentCounter}`,
      role: this.state.generated.assignmentCounter % 2 === 0 ? "Medic" : "Rescue Boat",
      targetZone: this.state.activeZone,
      etaMinutes: 6 + Math.round(this.nextRand() * 10),
      score: {
        distance: Number((0.6 + this.nextRand() * 0.4).toFixed(2)),
        skill: Number((0.65 + this.nextRand() * 0.35).toFixed(2)),
        load: Number((0.45 + this.nextRand() * 0.35).toFixed(2))
      },
      createdAt: this.now()
    };

    this.state.volunteerAssignments = [assignment, ...this.state.volunteerAssignments].slice(0, 20);
    return assignment;
  }

  updateFamilyFlow() {
    if (this.state.phase < 3) return null;
    const separatedDelta = Math.round(this.nextRand() * 2);
    const reunitedDelta = Math.round(this.nextRand());

    this.state.familyStatus.separatedCount = clamp(this.state.familyStatus.separatedCount + separatedDelta, 0, 500);
    this.state.familyStatus.reunitedCount = clamp(this.state.familyStatus.reunitedCount + reunitedDelta, 0, 500);
    const confidence = 78 + Math.round(this.nextRand() * 20);
    const match = {
      memberName: confidence > 90 ? "Anaya Das" : "Child Candidate",
      confidence,
      via: confidence > 88 ? "QR+Face Match" : "Face Match",
      zoneId: this.state.activeZone,
      timestamp: this.now()
    };
    this.state.familyStatus.latestMatch = match;
    return match;
  }

  tick() {
    if (!this.state.simMode) return;

    const createdSos = this.generateSOSBurst();
    const assignment = this.runVolunteerAllocation();
    const familyMatch = this.updateFamilyFlow();

    this.state.panicIndex = clamp(
      this.state.phase >= 3 ? this.state.panicIndex + (this.nextRand() > 0.5 ? 1 : -1) : this.state.panicIndex - 1,
      0,
      100
    );
    this.state.adminKpi.avgResponseMinutes = clamp(
      this.state.adminKpi.avgResponseMinutes + (this.state.adminKpi.volunteerDeficit > 20 ? 1 : -1),
      5,
      30
    );
    this.updateTimestamp();

    this.emitAll("simulate:tick", { createdSos, assignment, familyMatch });
  }

  emitToOps(event, payload) {
    if (!this.io) return;
    this.io.to("ops-room").emit(event, payload);
    this.io.to("admin-room").emit(event, payload);
  }

  emitAll(trigger, detail = {}) {
    const state = this.snapshot();
    this.emitToOps("state:scenario:update", {
      scenarioId: state.scenarioId,
      phase: state.phase,
      severity: state.severity,
      simMode: state.simMode,
      intensity: state.intensity,
      floodLevel: state.floodLevel,
      panicIndex: state.panicIndex,
      trigger,
      timestamp: state.timestamp
    });

    this.emitToOps("map:risk:update", {
      phase: state.phase,
      zones: state.zones,
      intensity: state.intensity,
      floodLevel: state.floodLevel,
      activeZone: state.activeZone,
      timestamp: state.timestamp
    });

    this.emitToOps("sos:stream:update", {
      phase: state.phase,
      activeCount: state.adminKpi.activeSOS,
      frequency: state.sosFrequency,
      recent: state.sosStream.slice(0, 12),
      timestamp: state.timestamp
    });

    this.emitToOps("volunteer:demand:update", {
      phase: state.phase,
      demand: state.volunteerDemand,
      assignments: state.volunteerAssignments.slice(0, 8),
      timestamp: state.timestamp
    });

    this.emitToOps("panic:index:update", {
      phase: state.phase,
      panic: state.panic,
      panicIndex: state.panicIndex,
      timestamp: state.timestamp
    });

    this.emitToOps("family:match:update", {
      phase: state.phase,
      familyStatus: state.familyStatus,
      timestamp: state.timestamp
    });

    this.emitToOps("admin:kpi:update", {
      phase: state.phase,
      kpi: state.adminKpi,
      resources: state.resources,
      timestamp: state.timestamp
    });

    this.emitToOps("broadcast:alert", {
      message: state.broadcast,
      severity: state.severity,
      phase: state.phase,
      timestamp: state.timestamp
    });

    if (detail.createdSos?.length) {
      detail.createdSos.forEach((sos) => {
        this.io.to("admin-room").emit("sos:new", sos);
      });
    }
  }

  start() {
    if (DEMO_MODE) return;
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 2500);
  }

  clearStoryTimer() {
    if (this.storyTimer) {
      clearTimeout(this.storyTimer);
      this.storyTimer = null;
    }
  }

  navigate(path) {
    if (this.io) this.io.emit("demo:navigate", { path });
  }

  playStory() {
    this.clearStoryTimer();
    this.applyReset();
    this.updateConfig({ simMode: true, intensity: 62, sosFrequency: 8 });

    // Step 1 — Cyclone → Dashboard
    this.applyCyclone({ intensity: 68 });
    this.navigate("/dashboard");

    // Step 2 — SOS page
    setTimeout(() => this.navigate("/sos"), 4000);

    // Step 3 — Flood + panic on SOS page
    this.storyTimer = setTimeout(() => {
      this.applyFlood({ intensity: 78, waterLevelMeters: 2.1, sosFrequency: 14 });
      this.navigate("/sos");
    }, 16000);

    // Step 4 — Panic → family
    setTimeout(() => {
      this.applyPanic({ panicIndex: 84, zoneId: "zone-cuttack-core" });
      this.navigate("/family");
    }, 32000);

    // Step 5 — Volunteer
    setTimeout(() => this.navigate("/volunteer"), 46000);

    // Step 6 — Admin
    setTimeout(() => this.navigate("/admin"), 58000);
  }
}

export const simulationEngine = new SimulationEngine();
