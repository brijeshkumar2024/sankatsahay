import { create } from "zustand";

const demoPins = [
  { id: "a1", type: "sos", coords: [20.2961, 85.8245], risk: "critical", mode: "silent", phase: 1 },
  { id: "a2", type: "sos", coords: [20.31, 85.83], risk: "warning", mode: "tap", phase: 1 },
  { id: "v1", type: "volunteer", coords: [20.29, 85.81], risk: "safe", phase: 1 }
];

const initialSimulation = {
  scenarioId: "cyclone-flood-panic-india-01",
  phase: 0,
  simMode: false,
  intensity: 35,
  floodLevel: 0.2,
  panicIndex: 8,
  severity: "WATCH",
  timestamp: new Date().toISOString()
};

const initialKpi = {
  activeSOS: 4,
  volunteerDeficit: 8,
  avgResponseMinutes: 12,
  panicAlerts: 0
};

const useAppStore = create((set) => ({
  token: null,
  user: null,
  panicMode: false,
  bleSignals: [{ count: 2, distanceMeters: 45, createdAt: new Date().toISOString() }],
  mapPins: demoPins,
  riskZones: [],
  simulation: initialSimulation,
  broadcastAlert: {
    message: "Simulation standby. Awaiting operator command.",
    severity: "WATCH",
    phase: 0,
    timestamp: new Date().toISOString()
  },
  sosStream: [],
  volunteerDemand: {
    required: 16,
    assigned: 8,
    medicsNeeded: 5,
    boatsNeeded: 2,
    searchTeamsNeeded: 3
  },
  volunteerAssignments: [],
  familyStatus: {
    separatedCount: 2,
    reunitedCount: 0,
    latestMatch: null
  },
  resources: {
    foodShortagePercent: 8,
    medicalShortagePercent: 10,
    shelterOccupancyPercent: 52
  },
  adminKpi: initialKpi,
  metrics: {
    sosResolved: 147,
    volunteersDeployed: 312,
    familiesReunited: 93,
    resourcesDispatched: 8200
  },
  setAuth: (token, user) => set({ token, user }),
  setPanicMode: (panicMode) => set({ panicMode }),
  // Full reset — restores all simulation-driven state to initial values
  resetSimulation: () => set({
    mapPins: demoPins,
    riskZones: [],
    simulation: initialSimulation,
    broadcastAlert: {
      message: "Simulation standby. Awaiting operator command.",
      severity: "WATCH",
      phase: 0,
      timestamp: new Date().toISOString()
    },
    sosStream: [],
    volunteerDemand: {
      required: 16,
      assigned: 8,
      medicsNeeded: 5,
      boatsNeeded: 2,
      searchTeamsNeeded: 3
    },
    volunteerAssignments: [],
    familyStatus: {
      separatedCount: 2,
      reunitedCount: 0,
      latestMatch: null
    },
    resources: {
      foodShortagePercent: 8,
      medicalShortagePercent: 10,
      shelterOccupancyPercent: 52
    },
    adminKpi: initialKpi,
  }),
  addMapPin: (pin) =>
    set((state) => {
      const deduped = state.mapPins.filter((existing) => existing.id !== pin.id);
      return { mapPins: [pin, ...deduped].slice(0, 80) };
    }),
  setMapPins: (mapPins) => set({ mapPins }),
  setMetrics: (metrics) => set({ metrics }),
  setSimulationState: (payload) => set((state) => ({ simulation: { ...state.simulation, ...payload } })),
  setRiskZones: (zones) => set({ riskZones: zones || [] }),
  setSosStream: (sosStream) => set({ sosStream: sosStream || [] }),
  setVolunteerDemand: (volunteerDemand, volunteerAssignments = null) =>
    set((state) => ({
      volunteerDemand: volunteerDemand || state.volunteerDemand,
      volunteerAssignments: volunteerAssignments || state.volunteerAssignments
    })),
  setFamilyStatus: (familyStatus) => set({ familyStatus: familyStatus || {} }),
  setAdminKpi: (kpi, resources = null) =>
    set((state) => ({
      adminKpi: kpi || state.adminKpi,
      resources: resources || state.resources
    })),
  setBroadcastAlert: (broadcastAlert) => set({ broadcastAlert })
}));

export { useAppStore };
export default useAppStore;
