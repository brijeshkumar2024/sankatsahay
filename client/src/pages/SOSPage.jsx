import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PanicReversal from "../components/ai/PanicReversal";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useTapSOS from "../hooks/useTapSOS";
import useVoiceSOS from "../hooks/useVoiceSOS";
import useAppStore from "../store/useAppStore";
import { api } from "../services/api";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useVibration from "../hooks/useVibration";
import useActiveAnimation from "../hooks/useActiveAnimation";
import useDemoFlow from "../hooks/useDemoFlow";

// ── Panic mode: 3 large buttons, calm background, breathing circle ────────────
function PanicScreen({ user, socket, userLocation, onExit }) {
  const navigate = useNavigate();
  const sosData = {
    userId: user?._id || user?.id,
    lat: userLocation?.lat,
    lng: userLocation?.lng,
    timestamp: new Date().toISOString(),
  };

  return (
    <div className="panic-screen">
      <motion.div
        className="panic-breathe"
        animate={{ scale: [1, 1.18, 1], opacity: [0.15, 0.28, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <p className="panic-hint">Stay calm. Help is on the way.</p>
      <button className="panic-btn panic-btn--red"   onClick={() => socket?.emit("sos:silent", sosData)}>SEND HELP</button>
      <button className="panic-btn panic-btn--blue"  onClick={() => navigate("/shelter")}>FIND SHELTER</button>
      <button className="panic-btn panic-btn--green" onClick={() => socket?.emit("family:status:update", { familyPin: user?.familyPin || "NEXORA", member: { _id: user?._id || user?.id, status: "SOS ACTIVE" } })}>CALL FAMILY</button>
      <button className="panic-exit" onClick={onExit}>Exit simplified mode</button>
      <PanicReversal isActive onDismiss={onExit} />
    </div>
  );
}

// ── Normal SOS view ───────────────────────────────────────────────────────────
export default function SOSPage() {
  const navigate   = useNavigate();
  const token      = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const user       = useAppStore((s) => s.user) || { id: "demo-user" };
  const simulation = useAppStore((s) => s.simulation);
  const addMapPin  = useAppStore((s) => s.addMapPin);
  const socket     = useSocket(token);
  useSimulationFeed(socket);
  const vibration  = useVibration();

  // Animation gated by step — NOT the page itself
  const animation      = useActiveAnimation();
  const sosPulseActive = animation.sosPulse;

  // Auto-trigger panic when demo step reaches "panic"
  const { currentStep } = useDemoFlow();

  // Tap counter — scoped to SOS button only, NOT window
  const tapTimestamps = useRef([]);
  const [tapCount,     setTapCount]     = useState(0);
  const [status,       setStatus]       = useState("Tap 3\u00d7 to send silent SOS");
  const [confirmed,    setConfirmed]    = useState(false);
  const [panicMode,    setPanicMode]    = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 20.2961, lng: 85.8245 });

  const triggerSOS = useCallback(async (payload) => {
    const { lat, lng } = payload;
    setStatus("Dispatching emergency alert\u2026");
    setConfirmed(true);
    try {
      await api.triggerSilentSOS({ coordinates: [lng, lat], mode: "tap" });
      setStatus("Help is coming. Stay calm.");
      addMapPin({ id: `s-${Date.now()}`, type: "sos", coords: [lat, lng], risk: "critical" });
    } catch {
      setStatus("Offline: Alert queued. Will send when reconnected.");
    }
  }, [addMapPin]);

  const { triggerSilentSOS } = useTapSOS({
    socket,
    userId: user?._id || user?.id,
    onTriggered: triggerSOS,
    onTapCount: setTapCount,
  });

  // Tap handler scoped to the SOS button — fires triggerSilentSOS at 3 taps
  const handleSOSTap = useCallback(() => {
    const now = Date.now();
    tapTimestamps.current = [...tapTimestamps.current, now].filter((t) => now - t < 2000);
    const count = tapTimestamps.current.length;
    setTapCount(count);
    if (count >= 3) {
      tapTimestamps.current = [];
      setTapCount(0);
      triggerSilentSOS();
    }
  }, [triggerSilentSOS]);

  const voice = useVoiceSOS(() => triggerSilentSOS());

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 20.2961, lng: 85.8245 })
    );
  }, []);

  // Auto-trigger panic from simulation phase
  useEffect(() => {
    if (simulation.phase >= 3 || simulation.panicIndex >= 80) {
      setPanicMode(true);
      vibration.calmPulse?.();
    }
  }, [simulation.panicIndex, simulation.phase, vibration]);

  // Auto-trigger panic when demo step indicator reaches "panic"
  useEffect(() => {
    if (currentStep === "panic") {
      setPanicMode(true);
    }
  }, [currentStep]);

  if (panicMode) {
    return (
      <PanicScreen
        user={user}
        socket={socket}
        userLocation={userLocation}
        onExit={() => setPanicMode(false)}
      />
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-3xl space-y-4 p-4"
    >
      <h2 className="font-heading text-2xl uppercase tracking-wide">Emergency SOS</h2>
      <p className="text-sm text-muted">Silent distress · Voice trigger · Panic reversal</p>

      <Card>
        <div className="relative mx-auto flex w-fit flex-col items-center py-8">
          {/* Pulse ring — ONLY when sos animation step is active */}
          {sosPulseActive && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-500/60"
              animate={{ scale: [1, 1.45, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <motion.button
            onClick={handleSOSTap}
            whileTap={{ scale: 0.95 }}
            className="relative h-48 w-48 rounded-full bg-red-600 text-4xl font-bold text-white shadow-lg"
          >
            SOS
          </motion.button>
        </div>

        <p className="text-center text-sm text-muted">Tap 3× for silent SOS ({tapCount}/3)</p>
        <p className="mt-2 text-center font-semibold text-green-400">{status}</p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button
            variant={voice.enabled ? "danger" : "ghost"}
            onClick={() => voice.setEnabled(!voice.enabled)}
          >
            Voice SOS: {voice.enabled ? "ON" : "OFF"}
          </Button>
          <Button variant="ghost" onClick={() => navigate("/shelter")}>
            Nearest Shelter
          </Button>
          <Button variant="ghost" onClick={() => setPanicMode(true)}>
            Simulate Panic Mode
          </Button>
        </div>
      </Card>

      {/* Confirmation overlay */}
      <AnimatePresence>
        {confirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/75"
            onClick={() => setConfirmed(false)}
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              className="glass rounded-2xl p-10 text-center"
            >
              <p className="font-heading text-3xl text-green-400">Help is coming.</p>
              <p className="mt-2 text-muted">Stay calm. Tap anywhere to dismiss.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
