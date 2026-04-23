import { useState, useRef, useCallback, useEffect } from "react";
import { get, set } from "idb-keyval";

const TAP_COUNT_REQUIRED = 3;
const TAP_WINDOW_MS = 3000;

export function useTapSOS({ onTrigger }) {
  const [tapCount, setTapCount] = useState(0);
  const tapsRef  = useRef([]);
  const timerRef = useRef(null);

  const handleTap = useCallback(() => {
    const now = Date.now();

    tapsRef.current = [...tapsRef.current, now].filter((t) => now - t < TAP_WINDOW_MS);
    const count = tapsRef.current.length;
    setTapCount(count);

    if (timerRef.current) clearTimeout(timerRef.current);

    // Auto-reset counter after window expires
    timerRef.current = setTimeout(() => {
      tapsRef.current = [];
      setTapCount(0);
    }, TAP_WINDOW_MS);

    if (count >= TAP_COUNT_REQUIRED) {
      tapsRef.current = [];
      setTapCount(0);
      clearTimeout(timerRef.current);

      // Fire overlay INSTANTLY with fallback coords — no GPS wait
      onTrigger({ lat: 20.2961, lng: 85.8245, timestamp: new Date().toISOString() });

      // Get real GPS in background (for the socket emit — overlay already shown)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => onTrigger({ lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: new Date().toISOString(), _gpsUpdate: true }),
          () => {},
          { timeout: 5000, maximumAge: 60000 }
        );
      }
    }
  }, [onTrigger]);

  return { tapCount, handleTap, tapsRequired: TAP_COUNT_REQUIRED };
}

// Kept as default export for backward compat with any remaining imports
export default function useTapSOSLegacy({ socket, userId, onTriggered }) {
  useEffect(() => {
    const flushQueue = async () => {
      if (!socket?.connected) return;
      const queue = (await get("offline-sos-queue")) || [];
      for (const item of queue) socket.emit("sos:silent", item);
      await set("offline-sos-queue", []);
    };
    window.addEventListener("online", flushQueue);
    flushQueue();
    return () => window.removeEventListener("online", flushQueue);
  }, [socket]);

  const triggerSilentSOS = useCallback(async () => {
    const payload = { lat: 20.2961, lng: 85.8245, userId, timestamp: new Date().toISOString() };
    if (!navigator.onLine || !socket?.connected) {
      const queue = (await get("offline-sos-queue")) || [];
      await set("offline-sos-queue", [...queue, payload]);
    } else {
      socket.emit("sos:silent", payload);
    }
    onTriggered?.(payload);
  }, [socket, userId, onTriggered]);

  return { triggerSilentSOS };
}
