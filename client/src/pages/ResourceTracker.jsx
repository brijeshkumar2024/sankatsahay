import { motion } from "framer-motion";
import Card from "../components/ui/Card";

export default function ResourceTracker() {
  return (
    <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl p-4">
      <h2 className="font-heading text-3xl">Resource Tracker</h2>
      <Card className="mt-4">
        <p className="text-muted">Zone A prediction: 3,200 food parcels needed in 6 hours.</p>
      </Card>
    </motion.main>
  );
}
