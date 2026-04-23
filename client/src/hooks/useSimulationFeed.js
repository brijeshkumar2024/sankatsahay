import { useEffect } from "react";
import useAppStore from "../store/useAppStore";
import { DEMO_MODE } from "../config/demoMode";

export default function useSimulationFeed(socket) {
  const setSimulationState = useAppStore((s) => s.setSimulationState);
  const setRiskZones = useAppStore((s) => s.setRiskZones);
  const setSosStream = useAppStore((s) => s.setSosStream);
  const setVolunteerDemand = useAppStore((s) => s.setVolunteerDemand);
  const setFamilyStatus = useAppStore((s) => s.setFamilyStatus);
  const setAdminKpi = useAppStore((s) => s.setAdminKpi);
  const setBroadcastAlert = useAppStore((s) => s.setBroadcastAlert);
  const addMapPin = useAppStore((s) => s.addMapPin);

  useEffect(() => {
    if (!socket) return undefined;

    socket.emit("join:ops");
    socket.emit("simulate:request-state");

    const onScenarioUpdate = (payload) => setSimulationState(payload);
    const onMapRiskUpdate = (payload) => setRiskZones(payload.zones || []);
    const onSosStreamUpdate = (payload) => {
      const recent = DEMO_MODE ? (payload.recent || []).slice(0, 1) : (payload.recent || []);
      setSosStream(recent);
      recent.forEach((event) => {
        if (typeof event.lat === "number" && typeof event.lng === "number") {
          addMapPin({
            id: event.id,
            type: "sos",
            coords: [event.lat, event.lng],
            risk: event.urgency || "critical",
            mode: event.mode,
            phase: event.phase
          });
        }
      });
    };
    const onVolunteerDemandUpdate = (payload) => {
      const assignments = DEMO_MODE ? (payload.assignments || []).slice(0, 1) : payload.assignments;
      setVolunteerDemand(payload.demand, assignments);
    };
    const onPanicUpdate = (payload) =>
      setSimulationState({
        panicIndex: payload.panicIndex,
        panic: payload.panic
      });
    const onFamilyUpdate = (payload) => setFamilyStatus(payload.familyStatus);
    const onKpiUpdate = (payload) => setAdminKpi(payload.kpi, payload.resources);
    const onBroadcast = (payload) => setBroadcastAlert(payload);

    socket.on("state:scenario:update", onScenarioUpdate);
    socket.on("map:risk:update", onMapRiskUpdate);
    socket.on("sos:stream:update", onSosStreamUpdate);
    socket.on("volunteer:demand:update", onVolunteerDemandUpdate);
    socket.on("panic:index:update", onPanicUpdate);
    socket.on("family:match:update", onFamilyUpdate);
    socket.on("admin:kpi:update", onKpiUpdate);
    socket.on("broadcast:alert", onBroadcast);

    return () => {
      socket.off("state:scenario:update", onScenarioUpdate);
      socket.off("map:risk:update", onMapRiskUpdate);
      socket.off("sos:stream:update", onSosStreamUpdate);
      socket.off("volunteer:demand:update", onVolunteerDemandUpdate);
      socket.off("panic:index:update", onPanicUpdate);
      socket.off("family:match:update", onFamilyUpdate);
      socket.off("admin:kpi:update", onKpiUpdate);
      socket.off("broadcast:alert", onBroadcast);
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
    socket
  ]);
}
