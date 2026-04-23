import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useAppStore from "../store/useAppStore";
import useActiveAnimation from "../hooks/useActiveAnimation";

function StatCard({ label, value, color }) {
  return (
    <Card>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className={`mt-2 font-mono text-4xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}

export default function VolunteerHub() {
  // NO step gate — page always renders
  const token       = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const socket      = useSocket(token);
  useSimulationFeed(socket);
  const demand      = useAppStore((s) => s.volunteerDemand);
  const assignments = useAppStore((s) => s.volunteerAssignments);

  // Route highlight animation — gated by step, NOT the page
  const animation   = useActiveAnimation();
  const routeActive = animation.volunteerHighlight;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-5xl space-y-4 p-4"
    >
      <h2 className="font-heading text-2xl uppercase tracking-wide">Volunteer Dispatch</h2>
      <p className="text-sm text-muted">AI-scored assignment: distance 40% · skill 40% · load 20%</p>

      {/* ── 3 stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Required" value={demand.required}                               color="text-red-400" />
        <StatCard label="Assigned" value={demand.assigned}                               color="text-green-400" />
        <StatCard label="Deficit"  value={Math.max(0, demand.required - demand.assigned)} color="text-amber-400" />
      </div>

      {/* ── Route highlight — ONLY when volunteer animation step active ── */}
      {routeActive && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-sky-500/40 bg-sky-950/60 px-4 py-3 text-sm text-sky-200"
        >
          <span className="mr-2 font-mono text-xs text-sky-400">ROUTE ACTIVE</span>
          AI-optimised evacuation corridor highlighted on map — ETA 8 min
        </motion.div>
      )}

      {/* ── Assignment list ───────────────────────────────────────────── */}
      <Card>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Recent Assignments</p>
        <div className="mt-3 space-y-2">
          {assignments.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-black/20 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-green-400">
                  {item.volunteerTag} → {item.targetZone}
                </p>
                <p className="text-sm text-muted">{item.role} · ETA {item.etaMinutes}m</p>
              </div>
              <p className="font-mono text-xs text-muted">
                d:{item.score?.distance} s:{item.score?.skill} l:{item.score?.load}
              </p>
            </div>
          ))}
          {assignments.length === 0 && (
            <p className="text-sm text-muted">Assignments appear once simulation starts.</p>
          )}
        </div>
      </Card>

      {/* ── Demand breakdown ─────────────────────────────────────────── */}
      <Card>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Demand Breakdown</p>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between border-b border-border pb-2">
            <span className="text-muted">Medics needed</span>
            <span className="font-mono text-green-400">{demand.medicsNeeded}</span>
          </li>
          <li className="flex justify-between border-b border-border pb-2">
            <span className="text-muted">Boats needed</span>
            <span className="font-mono text-green-400">{demand.boatsNeeded}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted">Search teams</span>
            <span className="font-mono text-green-400">{demand.searchTeamsNeeded}</span>
          </li>
        </ul>
      </Card>
    </motion.main>
  );
}
