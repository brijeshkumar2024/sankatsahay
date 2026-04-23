import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import useOffline from "../hooks/useOffline";

export default function OfflineMode() {
  const offline = useOffline();
  return (
    <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl p-4">
      <h2 className="font-heading text-3xl">Offline Mode</h2>
      <Card className="mt-4">
        <p className={offline ? "text-warn" : "text-safe"}>{offline ? "OFFLINE MODE ACTIVE" : "Online and synced"}</p>
      </Card>
    </motion.main>
  );
}
