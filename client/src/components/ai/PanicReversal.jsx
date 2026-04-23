import { useEffect } from "react";
import { motion } from "framer-motion";

// Speak breathing instructions using Web Speech API — no Tone.js
function speakCalm(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang   = "hi-IN";
  u.rate   = 0.7;
  u.pitch  = 0.9;
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

export default function PanicReversal({ isActive, onDismiss }) {
  useEffect(() => {
    if (!isActive) return undefined;

    // Speak the breathing prompt immediately
    speakCalm("घबराएं नहीं। आप सुरक्षित हैं। सांस लें। चार तक गिनें। रोकें। आठ तक गिनें।");

    // Repeat breathing cue every 19 seconds (4+7+8 cycle)
    const interval = setInterval(() => {
      speakCalm("सांस लें। चार। रोकें। सात। छोड़ें। आठ।");
    }, 19000);

    // Vibrate calm pattern
    navigator.vibrate?.([500, 500, 500, 500, 500]);

    // Auto-dismiss after 60 seconds
    const timeout = setTimeout(() => onDismiss?.(), 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.speechSynthesis?.cancel();
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
        <p className="mt-4 text-xl text-text">Breathe in 4 sec · Hold 7 sec · Breathe out 8 sec</p>

        {/* Breathing circle — the only animation */}
        <motion.div
          className="mx-auto mt-8 h-36 w-36 rounded-full border-2 border-live"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <p className="mt-6 text-sm text-muted">Tap anywhere to dismiss</p>
      </div>
    </motion.div>
  );
}
