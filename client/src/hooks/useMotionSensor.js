import { useEffect, useState } from "react";

export default function useMotionSensor() {
  const [signalDetected, setSignalDetected] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      const total = Math.abs(event.accelerationIncludingGravity?.x || 0) +
        Math.abs(event.accelerationIncludingGravity?.y || 0) +
        Math.abs(event.accelerationIncludingGravity?.z || 0);
      if (total > 40) {
        setSignalDetected(true);
      }
    };

    if ("DeviceMotionEvent" in window) {
      window.addEventListener("devicemotion", handler);
    }

    return () => {
      window.removeEventListener("devicemotion", handler);
    };
  }, []);

  return { signalDetected, resetSignal: () => setSignalDetected(false) };
}
