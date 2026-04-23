import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PanicReversal from "../components/ai/PanicReversal";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useTapSOS } from "../hooks/useTapSOS";
import useVoiceSOS from "../hooks/useVoiceSOS";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useDemoStore from "../store/useDemoStore";
import useDemoFlow from "../hooks/useDemoFlow";

// ── Panic mode: 3 large buttons, calm background, breathing circle ────────────
function PanicScreen({ user, socket, onExit }) {
  const navigate = useNavigate();
  const sosData = {
    userId: user?._id || user?.id,
    lat: 20.2961,
    lng: 85.8245,
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

// ── SOS confirmation overlay ──────────────────────────────────────────────────
function SOSConfirmOverlay({ onDismiss }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 9999,
    }}>
      <div style={{ fontSize: "48px", marginBottom: "24px" }}>🆘</div>
      <h1 style={{ color: "#10B981", fontSize: "32px", fontWeight: "bold", margin: "0 0 16px" }}>
        Help is Coming
      </h1>
      <p style={{ color: "#9CA3AF", fontSize: "18px", margin: 0 }}>
        Stay calm. Emergency services notified.
      </p>
      <button
        onClick={onDismiss}
        style={{
          marginTop: "32px", padding: "12px 32px",
          background: "transparent", border: "1px solid #6B7280",
          color: "#9CA3AF", borderRadius: "8px", cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Dismiss
      </button>
    </div>
  );
}

// ── Normal SOS view ───────────────────────────────────────────────────────────
export default function SOSPage() {
  const navigate  = useNavigate();
  const token     = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const user      = useAppStore((s) => s.user) || { id: "demo-user" };
  const simulation = useAppStore((s) => s.simulation);
  const addMapPin = useAppStore((s) => s.addMapPin);
  const socket    = useSocket(token);
  useSimulationFeed(socket);

  // Read pulse animation directly from useDemoStore — same source as Dashboard.
  // This avoids stale state from useDemoFlowStore when user navigates to /sos
  // without going through the demo step buttons.
  const activeAnimation = useDemoStore((s) => s.activeAnimation);
  const sosPulseActive  = activeAnimation === "sos-pulse";

  // Only used to detect panic step — NOT to auto-trigger SOS
  const { currentStep } = useDemoFlow();

  const [sosTriggered,   setSOSTriggered]   = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [panicMode,      setPanicMode]      = useState(false);

  // Called only when user physically taps the button 3 times
  const handleSOSTriggered = useCallback(({ lat, lng }) => {
    // Show overlay immediately
    setSOSTriggered(true);
    setConfirmMessage("Help is coming. Stay calm.");

    // Add pin to map
    addMapPin({ id: `s-${Date.now()}`, type: "sos", coords: [lat, lng], risk: "critical" });

    // Emit socket event — server saves to DB with valid coords
    socket?.emit("sos:silent", {
      userId: user?._id || user?.id || "demo-user",
      lat,
      lng,
      timestamp: new Date().toISOString(),
      type: "tap-sos",
    });

    // Auto-dismiss overlay after 10 seconds — do NOT auto-trigger panic here.
    // Panic is only triggered by the demo step button or simulation phase >= 3.
    setTimeout(() => {
      setSOSTriggered(false);
      setConfirmMessage("");
    }, 10000);
  }, [socket, user, addMapPin]);

  const { tapCount, handleTap, tapsRequired } = useTapSOS({ onTrigger: handleSOSTriggered });

  const voice = useVoiceSOS(() => {
    handleSOSTriggered({ lat: 20.2961, lng: 85.8245 });
  });

  // Panic only from simulation phase — NOT from SOS tap
  useEffect(() => {
    if (simulation.phase >= 3 || simulation.panicIndex >= 80) {
      setPanicMode(true);
    }
  }, [simulation.phase, simulation.panicIndex]);

  // Panic from demo step button (sim-control "Step: Panic")
  useEffect(() => {
    if (currentStep === "panic") setPanicMode(true);
  }, [currentStep]);

  if (panicMode) {
    return <PanicScreen user={user} socket={socket} onExit={() => setPanicMode(false)} />;
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
          {/* Pulse ring — ONLY when demo store activeAnimation is sos-pulse */}
          {sosPulseActive && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-500/60"
              animate={{ scale: [1, 1.45, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <motion.button
            onClick={handleTap}
            whileTap={{ scale: 0.92 }}
            className="relative h-48 w-48 rounded-full bg-red-600 text-4xl font-bold text-white shadow-lg active:bg-red-500"
          >
            SOS
          </motion.button>
        </div>

        <p className="text-center text-sm font-semibold text-muted">
          {tapCount > 0
            ? `${tapCount} / ${tapsRequired} \u2014 keep tapping!`
            : "Tap 3 times to send SOS"}
        </p>

        {confirmMessage && (
          <p className="mt-2 text-center font-semibold text-green-400">{confirmMessage}</p>
        )}

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

      {sosTriggered && <SOSConfirmOverlay onDismiss={() => setSOSTriggered(false)} />}
    </motion.main>
  );
}
