import { useEffect } from "react";
import { motion } from "framer-motion";
import LiveMap from "../components/map/LiveMap";
import Card from "../components/ui/Card";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useDemoFlow from "../hooks/useDemoFlow";
import useActiveAnimation from "../hooks/useActiveAnimation";

export default function Dashboard() {
  const { currentStep } = useDemoFlow();
  if (currentStep !== "cyclone") return null;

  const mapPins = useAppStore((s) => s.mapPins);
  const riskZones = useAppStore((s) => s.riskZones);
  const simulation = useAppStore((s) => s.simulation);
  const adminKpi = useAppStore((s) => s.adminKpi);
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
      <div className="broadcast-banner mb-4 rounded-xl px-4 py-3">
        <p className="text-xs text-red-100">STEP 1: CYCLONE IMPACT</p>
        <p className="mt-1 text-sm text-white">Risk zones rising. Awaiting SOS trigger.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveMap
            pins={mapPins}
            riskZones={riskZones}
            phase={simulation.phase}
            activeAnimation={animation.riskPulse ? "cyclone-pulse" : null}
          />
        </div>
        <div className="space-y-4">
          <Card>
            <p className="text-xs uppercase text-muted">Current phase</p>
            <p className="mt-2 text-xl text-alert">Cyclone</p>
            <p className="text-sm text-muted">Intensity: {simulation.intensity}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase text-muted">Active SOS</p>
            <p className="mt-2 font-mono text-4xl text-alert">{adminKpi.activeSOS}</p>
          </Card>
        </div>
      </div>
    </motion.main>
  );
}
