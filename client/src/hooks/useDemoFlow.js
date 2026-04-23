import { useEffect } from "react";
import { create } from "zustand";
import { DEMO_STEPS } from "../config/demoMode";

const STEP_INDEX = new Map(DEMO_STEPS.map((step, index) => [step, index]));

const useDemoFlowStore = create((set, get) => ({
  currentStep: "idle",
  waitingForUser: true,
  setWaitingForUser: (waitingForUser) => set({ waitingForUser }),
  setStep: (step, waitingForUser = true) => {
    if (!STEP_INDEX.has(step)) return;
    set({ currentStep: step, waitingForUser });
  },
  nextStep: () => {
    const { currentStep, waitingForUser } = get();
    if (waitingForUser) return currentStep;

    const index = STEP_INDEX.get(currentStep) ?? 0;
    const next = DEMO_STEPS[Math.min(index + 1, DEMO_STEPS.length - 1)];
    set({ currentStep: next, waitingForUser: true });
    return next;
  }
}));

export default function useDemoFlow() {
  const currentStep = useDemoFlowStore((s) => s.currentStep);
  const waitingForUser = useDemoFlowStore((s) => s.waitingForUser);
  const setWaitingForUser = useDemoFlowStore((s) => s.setWaitingForUser);
  const setStep = useDemoFlowStore((s) => s.setStep);
  const nextStep = useDemoFlowStore((s) => s.nextStep);

  return {
    currentStep,
    waitingForUser,
    setWaitingForUser,
    setStep,
    nextStep
  };
}

export function useDemoFlowSync(socket) {
  const setStep = useDemoFlowStore((s) => s.setStep);
  const setWaitingForUser = useDemoFlowStore((s) => s.setWaitingForUser);

  useEffect(() => {
    if (!socket) return undefined;

    socket.emit("demo:request-state");

    const onStepChanged = (payload) => {
      if (!payload?.step) return;
      setStep(payload.step, payload.waitingForUser ?? true);
    };

    const onWaiting = (payload) => {
      setWaitingForUser(Boolean(payload?.waitingForUser));
    };

    socket.on("demo:step-changed", onStepChanged);
    socket.on("demo:waiting", onWaiting);

    return () => {
      socket.off("demo:step-changed", onStepChanged);
      socket.off("demo:waiting", onWaiting);
    };
  }, [setStep, setWaitingForUser, socket]);
}

// Called by useDemoStore.goToStep so the Next→ button drives animation state
export function syncDemoStep(step) {
  useDemoFlowStore.getState().setStep(step, false);
}
