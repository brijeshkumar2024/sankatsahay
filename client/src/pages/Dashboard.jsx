import { useEffect } from "react";
import { motion } from "framer-motion";
import LiveMap from "../components/map/LiveMap";
import Card from "../components/ui/Card";
import DemoBanner from "../components/shared/DemoBanner";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useDemoFlow from "../hooks/useDemoFlow";
import useActiveAnimation from "../hooks/useActiveAnimation";

export default function Dashboard() {
  const { currentStep } = useDemoFlow();

  const mapPins = useAppStore((s) => s.mapPins);
  const riskZones = useAppStore((s) => s.riskZones);
  const simulation = useAppStore((s) => s.simulation);
  const adminKpi = useAppStore((s) => s.adminKpi);
  const metrics = useAppStore((s) => s.metrics);
  const token = useAppStore((s) => s.token);
  const socket = useSocket(token);
  useSimulationFeed(socket);
  const animation = useActiveAnimation();

  useEffect(() => {
    if (!socket) return;
    socket.emit("join:admin");
  }, [socket]);

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-7xl p-4">
      <DemoBanner />

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-muted">Active SOS</p>
          <p className="mt-2 font-mono text-4xl text-alert">{adminKpi?.activeSOS ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted">Volunteers Assigned</p>
          <p className="mt-2 font-mono text-4xl text-live">{metrics?.volunteersDeployed ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted">Families Reunited</p>
          <p className="mt-2 font-mono text-4xl text-safe">{metrics?.familiesReunited ?? 0}</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <LiveMap
            pins={mapPins}
            riskZones={riskZones}
            phase={simulation.phase}
            activeAnimation={animation.riskPulse ? "cyclone-pulse" : null}
          />
        </div>
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <p className="text-xs uppercase text-muted">Current phase</p>
            <p className="mt-2 text-xl text-alert">{simulation?.severity || "WATCH"}</p>
            <p className="text-sm text-muted">Demo step: {currentStep || "idle"}</p>
            <p className="text-sm text-muted">Intensity: {simulation?.intensity ?? 0}</p>
            <p className="text-sm text-muted">Flood level: {simulation?.floodLevel ?? 0}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase text-muted">Response Snapshot</p>
            <p className="mt-2 text-sm text-muted">Avg response: {adminKpi?.avgResponseMinutes ?? 0} mins</p>
            <p className="text-sm text-muted">Volunteer deficit: {adminKpi?.volunteerDeficit ?? 0}</p>
            <p className="text-sm text-muted">Panic alerts: {adminKpi?.panicAlerts ?? 0}</p>
          </Card>
        </div>
      </div>
    </motion.main>
  );
}
