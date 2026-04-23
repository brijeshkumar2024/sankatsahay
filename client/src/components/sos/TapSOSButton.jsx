import { motion } from "framer-motion";
import Button from "../ui/Button";

export default function TapSOSButton({ onManualTrigger }) {
  return (
    <div className="relative mx-auto w-fit">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-alert"
        animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      />
      <Button
        variant="danger"
        className="sos-pulse relative h-28 w-28 rounded-full text-lg font-bold"
        onClick={onManualTrigger}
      >
        SOS
      </Button>
    </div>
  );
}
