import { useEffect } from "react";
import useAppStore from "../store/useAppStore";
import useDemoStore from "../store/useDemoStore";
import { syncDemoStep } from "./useDemoFlow";
import { DEMO_MODE } from "../config/demoMode";

// Helper — update both the banner and the flow step so animations fire
function applyDemoStep(flowStep, banner, severity, animation) {
  const store = useDemoStore.getState();
  store.setBanner(banner, severity);
  store.setActiveAnimation(animation);
  // Sync useDemoFlowStore so useActiveAnimation() returns correct values
  syncDemoStep(flowStep);
}

export default function useSimulationFeed(socket) {
  const setSimulationState = useAppStore((s) => s.setSimulationState);
  const setRiskZones       = useAppStore((s) => s.setRiskZones);
  const setSosStream       = useAppStore((s) => s.setSosStream);
  const setVolunteerDemand = useAppStore((s) => s.setVolunteerDemand);
  const setFamilyStatus    = useAppStore((s) => s.setFamilyStatus);
  const setAdminKpi        = useAppStore((s) => s.setAdminKpi);
  const setBroadcastAlert  = useAppStore((s) => s.setBroadcastAlert);
  const addMapPin          = useAppStore((s) => s.addMapPin);

  useEffect(() => {
    if (!socket) return undefined;

    socket.emit("join:ops");
    socket.emit("simulate:request-state");

    // ── Core simulation state listeners ──────────────────────────────────────
    const onScenarioUpdate      = (payload) => setSimulationState(payload);
    const onMapRiskUpdate       = (payload) => setRiskZones(payload.zones || []);
    const onSosStreamUpdate     = (payload) => {
      const recent = DEMO_MODE ? (payload.recent || []).slice(0, 1) : (payload.recent || []);
      setSosStream(recent);
      recent.forEach((event) => {
        if (typeof event.lat === "number" && typeof event.lng === "number") {
          addMapPin({
            id:     event.id,
            type:   "sos",
            coords: [event.lat, event.lng],
            risk:   event.urgency || "critical",
            mode:   event.mode,
            phase:  event.phase,
          });
        }
      });
    };
    const onVolunteerDemandUpdate = (payload) => {
      const assignments = DEMO_MODE
        ? (payload.assignments || []).slice(0, 1)
        : payload.assignments;
      setVolunteerDemand(payload.demand, assignments);
    };
    const onPanicUpdate  = (payload) =>
      setSimulationState({ panicIndex: payload.panicIndex, panic: payload.panic });
    const onFamilyUpdate = (payload) => setFamilyStatus(payload.familyStatus);
    const onKpiUpdate    = (payload) => setAdminKpi(payload.kpi, payload.resources);

    // broadcast:alert — updates appStore AND useDemoStore banner
    const onBroadcast = (payload) => {
      setBroadcastAlert(payload);
      if (payload?.message) {
        const sev = (payload.severity || "watch").toLowerCase();
        useDemoStore.getState().setBanner(payload.message, sev);
      }
    };

    // ── Demo step listeners — wired directly to sim-control buttons ──────────
    // These fire when sim-control emits simulate:cyclone etc via socket
    const onSimCyclone = (payload) => {
      setSimulationState(payload);
      applyDemoStep(
        "cyclone",
        "Cyclone impact detected in coastal zone \u2014 Category 4 landfall.",
        "critical",
        "cyclone-pulse"
      );
      // Also update risk zones if payload includes them
      if (payload?.zones) setRiskZones(payload.zones);
    };

    const onSimFlood = (payload) => {
      setSimulationState(payload);
      applyDemoStep(
        "sos",
        "Flood escalation \u2014 water levels rising. Evacuation corridors active.",
        "critical",
        "sos-pulse"
      );
    };

    const onSimPanic = (payload) => {
      setSimulationState(payload);
      applyDemoStep(
        "panic",
        "High panic index detected \u2014 AI calm protocol activated.",
        "warning",
        "calm-breathe"
      );
    };

    const onSimReset = () => {
      // Reset all app store simulation data
      useAppStore.getState().resetSimulation();
      // Reset demo store — banner, animation, step indicator back to standby
      useDemoStore.getState().setBanner("System ready. Awaiting simulation start.", "watch");
      useDemoStore.getState().setActiveAnimation(null);
      useDemoStore.getState().goToStep(0);
      syncDemoStep("idle");
    };

    const onSimSOS = () => {
      applyDemoStep(
        "sos",
        "Multiple SOS signals received \u2014 dispatching emergency response.",
        "critical",
        "sos-pulse"
      );
    };

    const onSimConfigUpdate = (payload) => {
      if (payload) setSimulationState(payload);
    };

    // ── Register all listeners ────────────────────────────────────────────────
    socket.on("state:scenario:update",   onScenarioUpdate);
    socket.on("map:risk:update",         onMapRiskUpdate);
    socket.on("sos:stream:update",       onSosStreamUpdate);
    socket.on("volunteer:demand:update", onVolunteerDemandUpdate);
    socket.on("panic:index:update",      onPanicUpdate);
    socket.on("family:match:update",     onFamilyUpdate);
    socket.on("admin:kpi:update",        onKpiUpdate);
    socket.on("broadcast:alert",         onBroadcast);

    // Direct sim-control event listeners
    socket.on("simulate:cyclone",        onSimCyclone);
    socket.on("simulate:flood",          onSimFlood);
    socket.on("simulate:panic",          onSimPanic);
    socket.on("simulate:reset",          onSimReset);
    socket.on("simulate:sos",            onSimSOS);
    socket.on("simulate:config:update",  onSimConfigUpdate);

    return () => {
      socket.off("state:scenario:update",   onScenarioUpdate);
      socket.off("map:risk:update",         onMapRiskUpdate);
      socket.off("sos:stream:update",       onSosStreamUpdate);
      socket.off("volunteer:demand:update", onVolunteerDemandUpdate);
      socket.off("panic:index:update",      onPanicUpdate);
      socket.off("family:match:update",     onFamilyUpdate);
      socket.off("admin:kpi:update",        onKpiUpdate);
      socket.off("broadcast:alert",         onBroadcast);
      socket.off("simulate:cyclone",        onSimCyclone);
      socket.off("simulate:flood",          onSimFlood);
      socket.off("simulate:panic",          onSimPanic);
      socket.off("simulate:reset",          onSimReset);
      socket.off("simulate:sos",            onSimSOS);
      socket.off("simulate:config:update",  onSimConfigUpdate);
    };
  }, [
    addMapPin,
    setAdminKpi,
    setBroadcastAlert,
    setFamilyStatus,
    setRiskZones,
    setSimulationState,
    setSosStream,
    setVolunteerDemand,
    socket,
  ]);
}
