/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

function toRadians(v) { return (v * Math.PI) / 180; }

function bearingBetween([lat1, lng1], [lat2, lng2]) {
  const y = Math.sin(toRadians(lng2 - lng1)) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(toRadians(lng2 - lng1));
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function distanceMeters([lat1, lng1], [lat2, lng2]) {
  const R = 6371e3;
  const p1 = toRadians(lat1), p2 = toRadians(lat2);
  const dLat = toRadians(lat2 - lat1), dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Create a clean sine beep — called only after user gesture (audioReady = true)
async function playBeep(freqHz, durationSec = 0.1, pan = 0) {
  try {
    const Tone = await import("tone");
    await Tone.start();
    const panner = new Tone.Panner(pan).toDestination();
    const synth  = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope:   { attack: 0.01, decay: 0.08, sustain: 0, release: 0.08 },
    }).connect(panner);
    synth.triggerAttackRelease(freqHz, durationSec);
    // Dispose after sound finishes to avoid memory leak
    setTimeout(() => { synth.dispose(); panner.dispose(); }, 1500);
  } catch {
    // Audio blocked or unavailable — silent fail
  }
}

async function playForward()  { await playBeep(880, 0.08, 0); await new Promise(r => setTimeout(r, 200)); await playBeep(880, 0.08, 0); }
async function playLeft()     { await playBeep(660, 0.12, -1); }
async function playRight()    { await playBeep(660, 0.12,  1); }
async function playArrived()  { await playBeep(1046, 0.5, 0); }
async function playObstacle() { await playBeep(220, 0.2, 0); }

export default function SoundNav({
  target     = [20.305, 85.835],
  targetLat,
  targetLng,
  targetName = "Shelter",
  onArrived,
}) {
  const [audioReady, setAudioReady] = useState(false);
  const [direction,  setDirection]  = useState("FORWARD");
  const [distance,   setDistance]   = useState(null);
  const timerRef   = useRef(null);
  const cancelRef  = useRef(false);

  const resolvedTarget = useMemo(() => {
    if (typeof targetLat === "number" && typeof targetLng === "number") return [targetLat, targetLng];
    return target;
  }, [target, targetLat, targetLng]);

  const arrowRotation = direction === "LEFT" ? -90 : direction === "RIGHT" ? 90 : 0;

  const initAudio = useCallback(async () => {
    try {
      const Tone = await import("tone");
      await Tone.start();
      setAudioReady(true);
    } catch {
      setAudioReady(true); // proceed even if Tone fails
    }
  }, []);

  const tick = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelRef.current) return;
        const current = [pos.coords.latitude, pos.coords.longitude];
        const dist    = distanceMeters(current, resolvedTarget);
        setDistance(Math.round(dist));

        if (dist <= 30) {
          setDirection("ARRIVED");
          await playArrived();
          navigator.vibrate?.([200, 100, 200, 100, 200]);
          onArrived?.();
          return;
        }

        const bearing = bearingBetween(current, resolvedTarget);
        if (bearing < -30) {
          setDirection("LEFT");
          await playLeft();
          navigator.vibrate?.([200, 100, 200]);
        } else if (bearing > 30) {
          setDirection("RIGHT");
          await playRight();
          navigator.vibrate?.([500]);
        } else {
          setDirection("FORWARD");
          await playForward();
          navigator.vibrate?.([200]);
        }
      },
      () => playObstacle(), // GPS error — obstacle beep
      { timeout: 5000, maximumAge: 10000 }
    );
  }, [resolvedTarget, onArrived]);

  // Start ticking only after audio is enabled
  useEffect(() => {
    if (!audioReady) return undefined;
    cancelRef.current = false;
    tick();
    timerRef.current = setInterval(tick, 5000);
    return () => {
      cancelRef.current = true;
      clearInterval(timerRef.current);
    };
  }, [audioReady, tick]);

  if (!audioReady) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <p className="text-sm text-muted">Audio navigation uses directional beeps to guide you.</p>
        <button
          onClick={initAudio}
          className="rounded-xl bg-green-600 px-8 py-4 text-lg font-bold text-white hover:bg-green-500"
        >
          Tap to Enable Audio Navigation
        </button>
        <p className="text-xs text-muted">Required by browser — audio must start from a tap</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <p className="text-sm text-muted">Navigating to <span className="text-text font-semibold">{targetName}</span></p>

      {/* Direction arrow */}
      <svg
        width="120" height="120" viewBox="0 0 100 100"
        style={{ transform: `rotate(${arrowRotation}deg)`, transition: "transform 0.4s ease" }}
      >
        <polygon points="50,5 95,95 50,75 5,95" fill={direction === "ARRIVED" ? "#10B981" : "#79D4FF"} />
      </svg>

      <p className="font-heading text-3xl tracking-wide">
        {direction === "ARRIVED" ? "✓ ARRIVED" : direction}
      </p>

      {distance !== null && (
        <p className="text-muted">
          Distance: <span className="font-mono text-text">{distance}m</span>
        </p>
      )}

      <div className="mt-2 flex gap-4 text-xs text-muted">
        <span>🔊 Left = turn left</span>
        <span>🔊 Right = turn right</span>
        <span>🔊 Double = forward</span>
      </div>
    </div>
  );
}
