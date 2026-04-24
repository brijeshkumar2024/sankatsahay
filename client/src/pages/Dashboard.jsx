import { useEffect } from "react";
import { motion } from "framer-motion";
import LiveMap from "../components/map/LiveMap";
import Card from "../components/ui/Card";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useDemoStore from "../store/useDemoStore";

export default function Dashboard() {
  const mapPins    = useAppStore((s) => s.mapPins);
  const riskZones  = useAppStore((s) => s.riskZones);
  const simulation = useAppStore((s) => s.simulation);
  const adminKpi   = useAppStore((s) => s.adminKpi);
  const familySt   = useAppStore((s) => s.familyStatus);
  const demand     = useAppStore((s) => s.volunteerDemand);
  const token      = useAppStore((s) => s.token);
  const socket     = useSocket(token);
  useSimulationFeed(socket);

  // Read activeAnimation directly from useDemoStore — single source of truth
  // This reacts to BOTH sim-control buttons AND the Next→ step indicator
  const activeAnimation = useDemoStore((s) => s.activeAnimation);
  const transitioning   = useDemoStore((s) => s.transitioning);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join:admin");
  }, [socket]);

  const phaseLabel =
    simulation.phase === 1 ? "Cyclone Impact" :
    simulation.phase === 2 ? "Flood Escalation" :
    simulation.phase === 3 ? "Panic & Separation" :
    simulation.phase >= 4  ? "Stabilising" : "Standby";

  const phaseColor =
    simulation.phase >= 3 ? "text-red-400" :
    simulation.phase >= 1 ? "text-amber-400" : "text-green-400";

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: transitioning ? 0 : 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-7xl space-y-4 p-4"
    >
      {/* ── 3 KPIs ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Active SOS</p>
          <p className="mt-2 font-mono text-4xl font-bold text-red-400">{adminKpi?.activeSOS ?? 0}</p>
        </Card>
        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Assigned Volunteers</p>
          <p className="mt-2 font-mono text-4xl font-bold text-amber-400">{demand?.assigned ?? 0}</p>
        </Card>
        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Families Reunited</p>
          <p className="mt-2 font-mono text-4xl font-bold text-green-400">{familySt?.reunitedCount ?? 0}</p>
        </Card>
      </div>

      {/* ── Map + phase card ─────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <LiveMap
            pins={mapPins}
            riskZones={riskZones}
            phase={simulation.phase}
            activeAnimation={activeAnimation}
          />
        </div>

        <div className="space-y-4 lg:col-span-1">
          <Card>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">Phase</p>
            <p className={`mt-2 text-xl font-bold ${phaseColor}`}>{phaseLabel}</p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="text-muted">
                Intensity <span className="font-mono text-text">{simulation?.intensity ?? 0}</span>
              </p>
              <p className="text-muted">
                Panic index <span className="font-mono text-text">{simulation?.panicIndex ?? 0}</span>
              </p>
              <p className="text-muted">
                Flood level <span className="font-mono text-text">{Number(simulation?.floodLevel ?? 0).toFixed(1)}m</span>
              </p>
            </div>
          </Card>

          <Card>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">Simulation</p>
            <p className={`mt-2 text-sm font-semibold ${simulation.simMode ? "text-green-400" : "text-muted"}`}>
              {simulation.simMode ? "● LIVE" : "○ PAUSED"}
            </p>
            <p className="mt-1 font-mono text-xs text-muted">
              {simulation.scenarioId || "—"}
            </p>
          </Card>
        </div>
      </div>
    </motion.main>
  );
}
