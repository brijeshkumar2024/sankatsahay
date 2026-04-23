import { useRef } from "react";

// Tone.js is loaded lazily — only after a real user gesture.
// This prevents the "AudioContext was not allowed to start" error.
let toneModule = null;
const getTone = async () => {
  if (!toneModule) toneModule = await import("tone");
  return toneModule;
};

export default function useAudio() {
  const synthRef = useRef(null);

  const ensureSynth = async () => {
    const Tone = await getTone();
    // Tone.start() MUST be called inside a user-gesture handler.
    // Calling it here is safe because ensureSynth is only ever called
    // from click/tap handlers, never on mount.
    await Tone.start();
    if (!synthRef.current) {
      synthRef.current = new Tone.Synth().toDestination();
    }
    return synthRef.current;
  };

  const playDirection = async (direction = "forward") => {
    try {
      const synth = await ensureSynth();
      const note = direction === "left" ? "C4" : direction === "right" ? "E4" : "G4";
      synth.triggerAttackRelease(note, "8n");
    } catch {
      // Audio blocked — silently ignore, not critical for demo
    }
  };

  const startCalmTone = async () => {
    try {
      const synth = await ensureSynth();
      synth.triggerAttackRelease("A3", "2n");
    } catch {
      // Audio blocked — silently ignore
    }
  };

  return { playDirection, startCalmTone };
}
