import { AnimatePresence, motion } from "framer-motion";
import useDemoStore, { DEMO_UI_MODE } from "../../store/useDemoStore";
import useAppStore from "../../store/useAppStore";

const SEVERITY_STYLES = {
  critical: "border-red-500/60  bg-red-950/80  text-red-100",
  warning:  "border-amber-500/50 bg-amber-950/70 text-amber-100",
  watch:    "border-sky-500/40   bg-sky-950/70   text-sky-100",
  safe:     "border-green-500/40 bg-green-950/70 text-green-100",
};

const SEVERITY_DOT = {
  critical: "bg-red-400",
  warning:  "bg-amber-400",
  watch:    "bg-sky-400",
  safe:     "bg-green-400",
};

export default function DemoBanner() {
  const demoMessage   = useDemoStore((s) => s.bannerMessage);
  const severity      = useDemoStore((s) => s.bannerSeverity);
  const broadcast     = useAppStore((s) => s.broadcastAlert);

  // In demo mode use the controlled message; otherwise fall back to broadcast
  const message = DEMO_UI_MODE ? demoMessage : broadcast.message;
  if (!message) return null;

  const style = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.watch;
  const dot   = SEVERITY_DOT[severity]   ?? SEVERITY_DOT.watch;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className={`mx-auto max-w-7xl rounded-xl border px-4 py-2.5 ${style}`}
      >
        <div className="flex items-center gap-3">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
          <p className="font-mono text-xs uppercase tracking-widest opacity-60">
            {severity === "critical" ? "CRITICAL ALERT" : severity === "warning" ? "WARNING" : severity === "safe" ? "STABILISING" : "STATUS"}
          </p>
          <p className="ml-1 text-sm font-semibold">{message}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
