import { simulationEngine } from "./simulationEngine.js";

const DEMO_STEPS = ["idle", "cyclone", "sos", "panic", "family", "volunteer", "resolution"];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class DemoOrchestrator {
  constructor() {
    this.io = null;
    this.currentStep = "idle";
    this.waitingForUser = true;
  }

  attach(io) {
    this.io = io;
  }

  broadcast(event, payload) {
    if (!this.io) return;
    this.io.to("ops-room").emit(event, payload);
    this.io.to("admin-room").emit(event, payload);
  }

  setStep(step, waitingForUser = true) {
    if (!DEMO_STEPS.includes(step)) return;
    this.currentStep = step;
    this.waitingForUser = waitingForUser;
    this.broadcast("demo:step-changed", { step, waitingForUser });
    this.broadcast("demo:waiting", { waitingForUser });
  }

  getState() {
    return {
      step: this.currentStep,
      waitingForUser: this.waitingForUser
    };
  }

  async runStep(step) {
    switch (step) {
      case "idle":
        simulationEngine.applyReset();
        this.setStep("idle", true);
        break;
      case "cyclone":
        simulationEngine.applyCyclone({ intensity: 68, sosFrequency: 8 });
        this.setStep("cyclone", true);
        this.broadcast("map:risk:update", {
          source: "demoOrchestrator",
          phase: 1,
          timestamp: new Date().toISOString(),
          zones: [
            {
              id: "zone-puri",
              name: "Puri Coastal Impact",
              center: [19.8135, 85.8312],
              radiusMeters: 12000,
              severity: "CRITICAL",
              color: "#FF3B30",
              blink: true,
              intensity: 68
            },
            {
              id: "zone-bhubaneswar",
              name: "Bhubaneswar SOS Zone",
              center: [20.2961, 85.8245],
              radiusMeters: 8000,
              severity: "CRITICAL",
              color: "#FF3B30",
              blink: true,
              intensity: 68
            },
            {
              id: "zone-cuttack",
              name: "Cuttack Warning Zone",
              center: [20.4625, 85.8830],
              radiusMeters: 6000,
              severity: "WARNING",
              color: "#F59E0B",
              blink: false,
              intensity: 42
            }
          ]
        });
        break;
      case "sos":
        this.setStep("sos", true);
        this.broadcast("sos:manual", {
          status: "awaiting_user_click",
          timestamp: new Date().toISOString()
        });
        break;
      case "panic":
        simulationEngine.applyPanic({ panicIndex: 84, zoneId: "zone-cuttack-core" });
        this.setStep("panic", true);
        this.broadcast("panic:trigger", {
          panicIndex: 84,
          timestamp: new Date().toISOString()
        });
        break;
      case "family":
        this.setStep("family", true);
        this.broadcast("family:match", {
          confidence: 93,
          memberName: "Anaya Das",
          timestamp: new Date().toISOString()
        });
        break;
      case "volunteer":
        this.setStep("volunteer", true);
        this.broadcast("volunteer:assign", {
          role: "Medic",
          targetZone: "zone-cuttack-core",
          etaMinutes: 8,
          timestamp: new Date().toISOString()
        });
        break;
      case "resolution":
        this.setStep("resolution", true);
        this.broadcast("broadcast:alert", {
          message: "Situation stabilising — all SOS alerts resolved.",
          severity: "SAFE",
          phase: 4,
          timestamp: new Date().toISOString()
        });
        break;
      default:
        break;
    }
  }

  async runUserAction(action) {
    if (action === "sos:clicked" && this.currentStep === "sos") {
      this.waitingForUser = false;
      this.broadcast("demo:waiting", { waitingForUser: false });
      this.broadcast("sos:manual", { status: "clicked", timestamp: new Date().toISOString() });
      await delay(2000);
      this.broadcast("sos:confirmed", {
        status: "help_inbound",
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (action === "proceed") {
      this.waitingForUser = false;
      this.broadcast("demo:waiting", { waitingForUser: false });
    }
  }
}

export const demoOrchestrator = new DemoOrchestrator();
