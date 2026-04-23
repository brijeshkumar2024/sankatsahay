import { create } from "zustand";
import { syncDemoStep } from "../hooks/useDemoFlow";

// ─── DEMO CONTROL FLAG ────────────────────────────────────────────────────────
export const DEMO_UI_MODE = true;

// Phase → useDemoFlowStore step name mapping so Next→ button drives animations
const PHASE_TO_FLOW_STEP = {
  standby:   "idle",
  cyclone:   "cyclone",
  sos:       "sos",
  panic:     "panic",
  family:    "family",
  volunteer: "volunteer",
  resolved:  "resolution",
};

// Step definitions for the 5-phase demo flow
export const DEMO_STEPS = [
  { id: 0, phase: "standby",   label: "Standby",           banner: "System ready. Awaiting simulation start." },
  { id: 1, phase: "cyclone",   label: "Cyclone Impact",    banner: "Cyclone impact detected in coastal zone — Category 4 landfall." },
  { id: 2, phase: "sos",       label: "SOS Activated",     banner: "Multiple SOS signals received — dispatching emergency response." },
  { id: 3, phase: "panic",     label: "Panic Response",    banner: "High panic index detected — AI calm protocol activated." },
  { id: 4, phase: "family",    label: "Family Reunite",    banner: "Reunification mode active — 3 family members located." },
  { id: 5, phase: "volunteer", label: "Volunteer Deploy",  banner: "12 volunteers assigned — routes optimised by AI." },
  { id: 6, phase: "resolved",  label: "Stabilising",       banner: "Situation stabilising — all SOS alerts resolved." },
];

const useDemoStore = create((set, get) => ({
  step: 0,
  activePhase: "standby",
  bannerMessage: DEMO_STEPS[0].banner,
  bannerSeverity: "watch",   // "critical" | "warning" | "watch" | "safe"
  transitioning: false,

  // Which animation is currently allowed (only ONE at a time)
  activeAnimation: null,     // "cyclone-pulse" | "sos-pulse" | "calm-breathe" | "route-highlight" | null

  goToStep: (stepId) => {
    const def = DEMO_STEPS[stepId];
    if (!def) return;
    set({ transitioning: true });
    setTimeout(() => {
      set({
        step: stepId,
        activePhase: def.phase,
        bannerMessage: def.banner,
        bannerSeverity: stepId === 0 ? "watch"
          : stepId === 1 ? "critical"
          : stepId === 2 ? "critical"
          : stepId === 3 ? "warning"
          : stepId === 4 ? "warning"
          : stepId === 5 ? "watch"
          : "safe",
        activeAnimation: stepId === 1 ? "cyclone-pulse"
          : stepId === 2 ? "sos-pulse"
          : stepId === 3 ? "calm-breathe"
          : stepId === 5 ? "route-highlight"
          : null,
        transitioning: false,
      });
      // Sync useDemoFlowStore so useActiveAnimation() returns correct values
      syncDemoStep(PHASE_TO_FLOW_STEP[def.phase] ?? "idle");
    }, 300);
  },

  nextStep: () => {
    const { step } = get();
    const next = Math.min(step + 1, DEMO_STEPS.length - 1);
    get().goToStep(next);
  },

  prevStep: () => {
    const { step } = get();
    const prev = Math.max(step - 1, 0);
    get().goToStep(prev);
  },

  setBanner: (message, severity = "watch") =>
    set({ bannerMessage: message, bannerSeverity: severity }),

  // Directly set the active animation — used by socket event handlers
  setActiveAnimation: (activeAnimation) => set({ activeAnimation }),
}));

export default useDemoStore;
