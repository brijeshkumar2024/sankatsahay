import { useEffect } from "react";
import { motion } from "framer-motion";
import LiveMap from "../components/map/LiveMap";
import Card from "../components/ui/Card";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";

export default function Dashboard() {
  const mapPins = useAppStore((s) => s.mapPins);
  const riskZones = useAppStore((s) => s.riskZones);
  const simulation = useAppStore((s) => s.simulation);
  const broadcast = useAppStore((s) => s.broadcastAlert);
  const adminKpi = useAppStore((s) => s.adminKpi);
  const volunteerDemand = useAppStore((s) => s.volunteerDemand);
  const resources = useAppStore((s) => s.resources);
  const token = useAppStore((s) => s.token);
  const socket = useSocket(token);
  useSimulationFeed(socket);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join:admin");
  }, [socket]);

  return (
    <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mx-auto max-w-7xl p-4 ${simulation.phase >= 3 ? "panic-ui" : ""}`}>
      <section className="broadcast-banner rounded-xl px-4 py-3">
        <p className="text-xs text-red-100">Emergency Broadcast :: Phase {simulation.phase || 0} :: Severity {simulation.severity}</p>
        <p className="mt-1 text-sm text-white">{broadcast.message}</p>
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-3xl uppercase">National Response Command Map</h2>
        <p className="font-mono text-xs text-live">Realtime link: {simulation.simMode ? "SIMULATION ONLINE" : "PAUSED"}</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveMap pins={mapPins} riskZones={riskZones} phase={simulation.phase} />
        </div>
        <div className="space-y-4">
          <Card>
            <p className="text-xs uppercase text-muted">Phase Status</p>
            <p className="mt-2 text-xl text-alert">
              {simulation.phase === 1 ? "Cyclone Impact" : simulation.phase === 2 ? "Flood Escalation" : simulation.phase === 3 ? "Panic and Separation" : "Standby"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <p>Intensity <span className="font-mono text-live">{simulation.intensity}</span></p>
              <p>Flood m <span className="font-mono text-live">{Number(simulation.floodLevel || 0).toFixed(1)}</span></p>
              <p>Panic <span className="font-mono text-live">{simulation.panicIndex}</span></p>
              <p>Active SOS <span className="font-mono text-live">{adminKpi.activeSOS}</span></p>
            </div>
          </Card>

          <Card>
            <p className="text-xs uppercase text-muted">Volunteer Pressure</p>
            <p className="mt-2 text-lg">Required: <span className="font-mono text-alert">{volunteerDemand.required}</span></p>
            <p className="text-lg">Assigned: <span className="font-mono text-live">{volunteerDemand.assigned}</span></p>
            <p className="text-sm text-muted">Deficit: {adminKpi.volunteerDeficit}</p>
          </Card>

          <Card>
            <p className="text-xs uppercase text-muted">Resource Stress</p>
            <p className="mt-2 text-sm">Food shortage: <span className="font-mono text-warn">{resources.foodShortagePercent}%</span></p>
            <p className="text-sm">Medical shortage: <span className="font-mono text-alert">{resources.medicalShortagePercent}%</span></p>
            <p className="text-sm">Shelter occupancy: <span className="font-mono text-live">{resources.shelterOccupancyPercent}%</span></p>
          </Card>
        </div>
      </div>
    </motion.main>
  );
}
