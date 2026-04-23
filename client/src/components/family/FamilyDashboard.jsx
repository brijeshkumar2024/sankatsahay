import { motion } from "framer-motion";
import Card from "../ui/Card";

const badge = {
  SAFE: "bg-safe/20 text-safe",
  MISSING: "bg-warn/20 text-warn",
  FOUND: "bg-live/20 text-live",
  "SOS ACTIVE": "bg-alert/20 text-alert"
};

export default function FamilyDashboard({ members = [] }) {
  return (
    <div className="grid gap-3">
      {members.map((member, i) => (
        <motion.div
          key={member.id}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.08 }}
        >
          <Card className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{member.name}</p>
              <p className="font-mono text-xs text-muted">Last seen: {member.lastSeen}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs ${badge[member.status] || "bg-white/20"}`}>
              {member.status}
            </span>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
