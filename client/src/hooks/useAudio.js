import { useRef } from "react";
import * as Tone from "tone";

export default function useAudio() {
  const synthRef = useRef(null);

  const ensureSynth = async () => {
    if (!synthRef.current) {
      await Tone.start();
      synthRef.current = new Tone.Synth().toDestination();
    }
    return synthRef.current;
  };

  const playDirection = async (direction = "forward") => {
    const synth = await ensureSynth();
    const note = direction === "left" ? "C4" : direction === "right" ? "E4" : "G4";
    synth.triggerAttackRelease(note, "8n");
  };

  const startCalmTone = async () => {
    const synth = await ensureSynth();
    synth.triggerAttackRelease("A3", "2n");
  };

  return { playDirection, startCalmTone };
}
