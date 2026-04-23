import { motion } from "framer-motion";
import useDemoStore, { DEMO_STEPS, DEMO_UI_MODE } from "../../store/useDemoStore";

export default function DemoStepIndicator() {
  const step         = useDemoStore((s) => s.step);
  const goToStep     = useDemoStore((s) => s.goToStep);
  const transitioning = useDemoStore((s) => s.transitioning);

  if (!DEMO_UI_MODE) return null;

  const current = DEMO_STEPS[step];
  const total   = DEMO_STEPS.length - 1; // exclude standby from count

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: transitioning ? 0.3 : 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2"
    >
      {/* Step label */}
      <p className="font-mono text-xs text-muted">
        {step === 0 ? "DEMO READY" : `STEP ${step} / ${total}`}
        <span className="ml-2 text-live">{current?.label}</span>
      </p>

      {/* Dot progress */}
      <div className="flex items-center gap-1.5">
        {DEMO_STEPS.map((s) => (
          <button
            key={s.id}
            onClick={() => goToStep(s.id)}
            title={s.label}
            className={`h-2 rounded-full transition-all duration-300 ${
              s.id === step
                ? "w-6 bg-live"
                : s.id < step
                ? "w-2 bg-live/40"
                : "w-2 bg-border"
            }`}
          />
        ))}
      </div>

      {/* Prev / Next */}
      <div className="flex gap-2">
        <button
          onClick={() => useDemoStore.getState().prevStep()}
          disabled={step === 0}
          className="rounded-lg border border-border px-3 py-1 font-mono text-xs text-muted transition hover:text-text disabled:opacity-30"
        >
          ← Prev
        </button>
        <button
          onClick={() => useDemoStore.getState().nextStep()}
          disabled={step >= DEMO_STEPS.length - 1}
          className="rounded-lg border border-live/50 px-3 py-1 font-mono text-xs text-live transition hover:bg-live/10 disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </motion.div>
  );
}
