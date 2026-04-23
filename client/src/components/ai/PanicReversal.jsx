import { useEffect } from "react";
import { motion } from "framer-motion";
import * as Tone from "tone";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function PanicReversal({ isActive, onDismiss }) {
  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;

    const runProtocol = async () => {
      await Tone.start();
      const synth = new Tone.Synth({ oscillator: { type: "sine" } }).toDestination();
      document.body.style.transition = "opacity 300ms ease";
      document.body.style.opacity = "0.3";
      navigator.vibrate?.([500, 500, 500, 500, 500]);

      for (let i = 0; i < 3 && !cancelled; i += 1) {
        synth.triggerAttackRelease(396, 4);
        await sleep(4000);
        if (cancelled) break;
        await sleep(7000);
        if (cancelled) break;
        synth.triggerAttackRelease(285, 8);
        await sleep(8000);
      }
      synth.dispose();
    };

    runProtocol();
    const timeout = setTimeout(() => {
      onDismiss?.();
    }, 60000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      document.body.style.opacity = "1";
    };
  }, [isActive, onDismiss]);

  if (!isActive) return null;

  return (
    <motion.div
      onClick={onDismiss}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="glass max-w-2xl rounded-2xl border border-live/40 p-8 text-center">
        <p className="font-heading text-4xl text-live">You are safe. Help is coming.</p>
        <p className="mt-4 text-xl text-text">Breathe in 4 sec. Hold 7 sec. Breathe out 8 sec.</p>
        <motion.div
          className="mx-auto mt-8 h-36 w-36 rounded-full border-2 border-live"
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}
