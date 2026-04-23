import { motion } from "framer-motion";
import Card from "../components/ui/Card";

export default function TouristSupport() {
  return (
    <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl p-4">
      <h2 className="font-heading text-3xl">Tourist Support</h2>
      <Card className="mt-4">
        <p className="text-muted">Embassy contacts, consulate finder, and emergency translation QR enabled.</p>
      </Card>
    </motion.main>
  );
}
