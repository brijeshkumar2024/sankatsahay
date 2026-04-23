import { useEffect, useRef } from "react";
import { get, set } from "idb-keyval";

function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 20.2961, lng: 85.8245 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: 20.2961, lng: 85.8245 }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export default function useTapSOS({ socket, userId, onTriggered, onTapCount }) {
  const tapsRef = useRef([]);
  const lockRef = useRef(false);

  const triggerSilentSOS = async () => {
    if (lockRef.current) return;
    lockRef.current = true;

    const location = await getCurrentLocation();
    const payload = {
      lat: location.lat,
      lng: location.lng,
      userId,
      timestamp: new Date().toISOString()
    };

    if (!navigator.onLine || !socket || !socket.connected) {
      const queue = (await get("offline-sos-queue")) || [];
      await set("offline-sos-queue", [...queue, payload]);
    } else {
      socket.emit("sos:silent", payload);
    }

    onTriggered?.(payload);
    setTimeout(() => {
      lockRef.current = false;
    }, 700);
  };

  useEffect(() => {
    const flushQueue = async () => {
      if (!socket || !socket.connected) return;
      const queue = (await get("offline-sos-queue")) || [];
      for (const item of queue) {
        socket.emit("sos:silent", item);
      }
      await set("offline-sos-queue", []);
    };

    window.addEventListener("online", flushQueue);
    flushQueue();
    return () => window.removeEventListener("online", flushQueue);
  }, [socket]);

  useEffect(() => {
    const registerTap = () => {
      const now = Date.now();
      tapsRef.current = [...tapsRef.current.filter((t) => now - t < 2000), now];
      onTapCount?.(tapsRef.current.length);
      if (tapsRef.current.length >= 3) {
        tapsRef.current = [];
        onTapCount?.(0);
        triggerSilentSOS();
      }
    };

    window.addEventListener("touchstart", registerTap, { passive: true });
    window.addEventListener("click", registerTap, { passive: true });
    return () => {
      window.removeEventListener("touchstart", registerTap);
      window.removeEventListener("click", registerTap);
    };
  }, [onTapCount, socket, userId]);

  return {
    triggerSilentSOS
  };
}
