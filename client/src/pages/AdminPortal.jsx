import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useDemoFlow from "../hooks/useDemoFlow";

function KpiCard({ label, value, color }) {
  return (
    <Card>
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className={`mt-2 font-mono text-4xl ${color}`}>{value}</p>
    </Card>
  );
}

export default function AdminPortal() {
  const { currentStep } = useDemoFlow();
  if (currentStep !== "resolution") return null;

  const token = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const socket = useSocket(token);
  useSimulationFeed(socket);

  const adminKpi = useAppStore((s) => s.adminKpi);
  const demand = useAppStore((s) => s.volunteerDemand);
  const family = useAppStore((s) => s.familyStatus);

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl p-4">
      <div className="broadcast-banner mb-4 rounded-xl px-4 py-3">
        <p className="text-xs text-red-100">STEP 5: RESOLUTION</p>
        <p className="mt-1 text-sm text-white">Response is stabilizing. Key outcomes are visible below.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Active SOS" value={adminKpi.activeSOS} color="text-alert" />
        <KpiCard label="Assigned Volunteers" value={demand.assigned} color="text-warn" />
        <KpiCard label="Families Reunited" value={family.reunitedCount} color="text-safe" />
      </div>

      <Card className="mt-4">
        <p className="text-xs uppercase text-muted">AI Outcome Summary</p>
        <p className="mt-3 text-sm">AI prioritizes high-risk zones for response ordering.</p>
        <p className="text-sm">AI ranks SOS urgency so critical cases are handled first.</p>
        <p className="text-sm">AI suggests volunteer assignment using proximity and role fit.</p>
        <p className="text-sm">AI recommends safer rescue routes under current conditions.</p>
      </Card>
    </motion.main>
  );
}
