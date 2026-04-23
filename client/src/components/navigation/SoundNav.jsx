/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import * as Tone from "tone";

function toRadians(v) {
  return (v * Math.PI) / 180;
}

function bearingBetween([lat1, lng1], [lat2, lng2]) {
  const y = Math.sin(toRadians(lng2 - lng1)) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(toRadians(lng2 - lng1));
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function distanceMeters([lat1, lng1], [lat2, lng2]) {
  const R = 6371e3;
  const p1 = toRadians(lat1);
  const p2 = toRadians(lat2);
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SoundNav({ target = [20.305, 85.835], targetLat, targetLng, targetName = "Shelter", onArrived }) {
  const [direction, setDirection] = useState("FORWARD");
  const [distance, setDistance] = useState(0);
  const resolvedTarget = useMemo(() => {
    if (typeof targetLat === "number" && typeof targetLng === "number") return [targetLat, targetLng];
    return target;
  }, [target, targetLat, targetLng]);

  const arrowRotation = useMemo(() => {
    if (direction === "LEFT") return -90;
    if (direction === "RIGHT") return 90;
    if (direction === "ARRIVED") return 0;
    return 0;
  }, [direction]);

  useEffect(() => {
    let timer;
    let cancelled = false;

    const run = async () => {
      await Tone.start();

      const tick = () => {
        // eslint-disable-next-line sonarjs/no-nested-functions
        navigator.geolocation.getCurrentPosition(async (pos) => {
          if (cancelled) return;
          const current = [pos.coords.latitude, pos.coords.longitude];
          const dist = distanceMeters(current, resolvedTarget);
          setDistance(Math.round(dist));

          if (dist <= 30) {
            setDirection("ARRIVED");
            const synth = new Tone.Synth().toDestination();
            synth.triggerAttackRelease(1046, "2n");
            navigator.vibrate?.([200, 100, 200, 100, 200]);
            onArrived?.();
            return;
          }

          const bearing = bearingBetween(current, resolvedTarget);
          if (bearing < -30) {
            setDirection("LEFT");
            const p = new Tone.Panner(-1).toDestination();
            const synth = new Tone.Synth().connect(p);
            synth.triggerAttackRelease(880, "8n");
            navigator.vibrate?.([200, 100, 200]);
          } else if (bearing > 30) {
            setDirection("RIGHT");
            const p = new Tone.Panner(1).toDestination();
            const synth = new Tone.Synth().connect(p);
            synth.triggerAttackRelease(880, "8n");
            navigator.vibrate?.([500]);
          } else {
            setDirection("FORWARD");
            const synth = new Tone.Synth().toDestination();
            synth.triggerAttackRelease(880, "16n", undefined, 0.7);
            synth.triggerAttackRelease(880, "16n", "+0.2", 0.7);
            navigator.vibrate?.([200]);
          }
        });
      };

      tick();
      timer = setInterval(tick, 5000);
    };

    run();
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [resolvedTarget, onArrived]);

  return (
    <div className="glass rounded-2xl p-6 text-center">
      <p className="mb-2 text-sm text-muted">Navigating to {targetName}</p>
      <svg width="300" height="300" viewBox="0 0 100 100" className="mx-auto" style={{ transform: `rotate(${arrowRotation}deg)` }}>
        <polygon points="50,5 95,95 50,75 5,95" fill="#00D4FF" />
      </svg>
      <p className="font-heading text-3xl">{direction}</p>
      <p className="mt-2 text-muted">Distance: {distance}m</p>
    </div>
  );
}
