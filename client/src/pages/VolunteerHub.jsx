import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useAppStore from "../store/useAppStore";

export default function VolunteerHub() {
  const token = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const socket = useSocket(token);
  useSimulationFeed(socket);
  const demand = useAppStore((s) => s.volunteerDemand);
  const assignments = useAppStore((s) => s.volunteerAssignments);
  const simulation = useAppStore((s) => s.simulation);

  return (
    <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mx-auto max-w-7xl p-4 ${simulation.phase >= 3 ? "panic-ui" : ""}`}>
      <h2 className="font-heading text-3xl uppercase">Volunteer Allocation Console</h2>
      <p className="mt-1 text-muted">Logic-driven dispatch based on distance, skill score, and active workload.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-muted">Required responders</p>
          <p className="mt-2 font-mono text-4xl text-alert">{demand.required}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted">Assigned responders</p>
          <p className="mt-2 font-mono text-4xl text-live">{demand.assigned}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted">Deficit</p>
          <p className="mt-2 font-mono text-4xl text-warn">{Math.max(0, demand.required - demand.assigned)}</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">Demand Breakdown</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li>Medics needed: <span className="font-mono text-live">{demand.medicsNeeded}</span></li>
            <li>Boats needed: <span className="font-mono text-live">{demand.boatsNeeded}</span></li>
            <li>Search teams needed: <span className="font-mono text-live">{demand.searchTeamsNeeded}</span></li>
          </ul>
        </Card>
        <Card>
          <p className="text-sm text-muted">Assignment Logic</p>
          <p className="mt-2 text-sm">Score = distance(40%) + skill(40%) + load(20%).</p>
          <p className="text-sm">Higher score responders are prioritized for critical SOS clusters.</p>
        </Card>
      </div>

      <Card className="mt-4">
        <p className="text-sm text-muted">Recent Assignments</p>
        <div className="mt-3 space-y-2">
          {assignments.slice(0, 8).map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-black/20 p-3">
              <p className="font-semibold text-live">{item.volunteerTag} {"->"} {item.targetZone}</p>
              <p className="text-sm text-muted">{item.role} | ETA {item.etaMinutes}m</p>
              <p className="font-mono text-xs text-muted">
                distance:{item.score?.distance} skill:{item.score?.skill} load:{item.score?.load}
              </p>
            </div>
          ))}
          {assignments.length === 0 ? <p className="text-sm text-muted">Assignments will appear once simulation starts.</p> : null}
        </div>
      </Card>
    </motion.main>
  );
}
