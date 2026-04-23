import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import EmotionDetector from "../components/ai/EmotionDetector";
import PanicReversal from "../components/ai/PanicReversal";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useTapSOS from "../hooks/useTapSOS";
import useVoiceSOS from "../hooks/useVoiceSOS";
import useBluetooth from "../hooks/useBluetooth";
import useAppStore from "../store/useAppStore";
import { api } from "../services/api";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useVibration from "../hooks/useVibration";

export default function SOSPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const user = useAppStore((s) => s.user) || { id: "demo-user" };
  const socket = useSocket(token);
  useSimulationFeed(socket);
  const vibration = useVibration();
  const simulation = useAppStore((s) => s.simulation);
  const broadcast = useAppStore((s) => s.broadcastAlert);
  const ble = useBluetooth(socket, user?._id || user?.id);
  const tapTimestamps = useRef([]);

  const [status, setStatus] = useState("Tap 3 times to send silent SOS");
  const [panicOn, setPanicOn] = useState(false);
  const [panicMode, setPanicMode] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [userLocation, setUserLocation] = useState({ lat: 20.2961, lng: 85.8245 });
  const addMapPin = useAppStore((s) => s.addMapPin);
  const emergencyMode = confirmed || panicOn;

  const buildAutoAlertPayload = useCallback(() => ({
    userId: user?._id || user?.id,
    lat: userLocation?.lat,
    lng: userLocation?.lng,
    reason: "User unresponsive for 10 minutes during emergency mode",
    timestamp: new Date().toISOString()
  }), [user, userLocation]);

  const trackTap = useCallback(() => {
    const now = Date.now();
    tapTimestamps.current = [...tapTimestamps.current, now].filter((t) => now - t < 5000);
    if (tapTimestamps.current.length >= 5) {
      setPanicMode(true);
    }
  }, []);

  const triggerSOS = useCallback(async (payload) => {
    const { lat, lng } = payload;
    setStatus("Dispatching emergency alert...");
    setConfirmed(true);
    setPanicOn(true);

    try {
      await api.triggerSilentSOS({ coordinates: [lng, lat], mode: "tap" });
      setStatus(t("helpComing"));
      addMapPin({ id: `s-${Date.now()}`, type: "sos", coords: [lat, lng], risk: "critical" });
      const fresh = await api.getActiveSOS();
      setAlerts(fresh.slice(0, 3));
    } catch {
      setStatus("Offline: Alert queued. Will send when reconnected.");
    }
  }, [t, addMapPin]);

  const { triggerSilentSOS } = useTapSOS({
    socket,
    userId: user?._id || user?.id,
    onTriggered: triggerSOS,
    onTapCount: setTapCount
  });

  const voice = useVoiceSOS(() => triggerSilentSOS());

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 20.2961, lng: 85.8245 })
    );
  }, []);

  useEffect(() => {
    if (!panicMode) return undefined;
    const timer = setTimeout(() => setPanicMode(false), 120000);
    return () => clearTimeout(timer);
  }, [panicMode]);

  useEffect(() => {
    if (simulation.phase >= 3 || simulation.panicIndex >= 80) {
      setPanicOn(true);
      vibration.calmPulse();
    }
  }, [simulation.panicIndex, simulation.phase, vibration]);

  useEffect(() => {
    const INACTIVITY_LIMIT = 10 * 60 * 1000;
    if (!emergencyMode || !socket) return undefined;

    let timer;
    const emitAutoAlert = () => {
      const payload = buildAutoAlertPayload();
      socket.emit("sos:auto-alert", payload);
      socket.emit("family:status:update", {
        familyPin: user?.familyPin || "NEXORA",
        member: {
          _id: user?._id || user?.id,
          status: "SOS ACTIVE",
          note: "Auto-alert: no activity detected"
        }
      });
    };

    const startTimer = () => {
      timer = setTimeout(emitAutoAlert, INACTIVITY_LIMIT);
    };

    const resetTimer = () => {
      clearTimeout(timer);
      startTimer();
    };

    startTimer();
    globalThis.addEventListener("touchstart", resetTimer);
    globalThis.addEventListener("click", resetTimer);

    return () => {
      clearTimeout(timer);
      globalThis.removeEventListener("touchstart", resetTimer);
      globalThis.removeEventListener("click", resetTimer);
    };
  }, [buildAutoAlertPayload, emergencyMode, socket, user]);

  useEffect(() => {
    api.getActiveSOS().then((list) => setAlerts(list.slice(0, 3))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("sos:new", (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 3));
    });
    return () => {
      socket.off("sos:new");
    };
  }, [socket]);

  const panicCards = useMemo(() => ["SOS", "SHELTER", "CALL FAMILY"], []);

  if (panicMode) {
    const sosData = {
      userId: user?._id || user?.id,
      lat: userLocation?.lat,
      lng: userLocation?.lng,
      timestamp: new Date().toISOString()
    };
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1A0707",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          padding: "40px"
        }}
      >
        <p style={{ color: "#9CA3AF", fontSize: "14px" }}>Simplified mode - stay calm</p>
        <button
          onClick={() => {
            trackTap();
            socket?.emit("sos:silent", sosData);
          }}
          style={{
            width: "100%",
            padding: "32px",
            fontSize: "24px",
            background: "#FF4500",
            color: "white",
            border: "none",
            borderRadius: "16px",
            cursor: "pointer"
          }}
        >
          SOS - SEND HELP
        </button>
        <button
          onClick={() => {
            trackTap();
            navigate("/shelter");
          }}
          style={{
            width: "100%",
            padding: "32px",
            fontSize: "24px",
            background: "#185FA5",
            color: "white",
            border: "none",
            borderRadius: "16px",
            cursor: "pointer"
          }}
        >
          FIND SHELTER
        </button>
        <button
          onClick={() => {
            trackTap();
            socket?.emit("family:status:update", {
              familyPin: user?.familyPin || "NEXORA",
              member: { _id: user?._id || user?.id, status: "SOS ACTIVE" }
            });
          }}
          style={{
            width: "100%",
            padding: "32px",
            fontSize: "24px",
            background: "#3B6D11",
            color: "white",
            border: "none",
            borderRadius: "16px",
            cursor: "pointer"
          }}
        >
          CALL FAMILY
        </button>
        <PanicReversal isActive={true} onDismiss={() => setPanicMode(false)} />
      </div>
    );
  }

  return (
    <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mx-auto max-w-7xl p-4 ${simulation.phase >= 3 ? "panic-ui" : ""}`}>
      <div className="broadcast-banner mb-4 rounded-xl px-4 py-3">
        <p className="text-xs text-red-100">SOS CHANNEL :: PHASE {simulation.phase} :: PANIC INDEX {simulation.panicIndex}</p>
        <p className="mt-1 text-sm text-white">{broadcast.message}</p>
      </div>
      <h2 className="font-heading text-3xl">Emergency SOS Console</h2>
      <p className="mt-2 text-muted">Silent distress, voice trigger, emotion intelligence, and panic reversal in one flow.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="relative mx-auto w-fit py-6">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-alert"
              animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.button
              onClick={() => {
                trackTap();
                triggerSilentSOS();
              }}
              whileTap={{ scale: 0.95 }}
              className="relative h-[200px] w-[200px] rounded-full bg-alert text-4xl font-bold text-white shadow-danger"
            >
              SOS
            </motion.button>
          </div>
          <p className="text-center text-sm text-muted">Tap 3 times to send silent SOS ({tapCount}/3)</p>
          <p className="mt-4 text-center font-semibold text-live">{status}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button variant={voice.enabled ? "danger" : "ghost"} onClick={() => { trackTap(); voice.setEnabled(!voice.enabled); }}>
              Voice SOS: {voice.enabled ? "ON" : "OFF"}
            </Button>
            <Button variant="ghost" onClick={() => { trackTap(); triggerSilentSOS(); }}>Manual Silent SOS</Button>
            <Button variant="ghost" onClick={() => { trackTap(); navigate("/shelter"); }}>Navigate to Nearest Shelter</Button>
          </div>
        </Card>

        <EmotionDetector userId={user?._id || user?.id} socket={socket} onPanicDetected={() => setPanicOn(true)} />
      </div>

      <AnimatePresence>
        {panicOn ? <PanicReversal isActive={panicOn} onDismiss={() => setPanicOn(false)} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {confirmed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
            onClick={() => setConfirmed(false)}
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              className="glass rounded-2xl p-8 text-center"
            >
              <p className="font-heading text-3xl text-live">Help is coming. Stay calm.</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Card className="mt-5">
        <h3 className="font-heading text-xl">Latest Active SOS Alerts</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {alerts.map((a) => (
            <div key={a._id || a.id} className="rounded-xl border border-border bg-white/5 p-3">
              <p className="font-semibold text-alert">{a.mode || "tap".toUpperCase()} SOS</p>
              <p className="text-sm text-muted">{a.status || "active"}</p>
              <p className="font-mono text-xs text-muted">{new Date(a.createdAt || Date.now()).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-5">
        <h3 className="font-heading text-xl">Panic Adaptive UI</h3>
        <p className="mb-3 mt-1 text-sm text-muted">When panic taps increase, UI morphs to large actions.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {panicCards.map((item) => (
            <motion.button
              key={item}
              layoutId={`panic-${item}`}
              className="h-16 rounded-xl bg-alert/15 text-lg font-bold text-alert"
            >
              {item}
            </motion.button>
          ))}
        </div>
      </Card>

      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xl">Bluetooth Alive Detection</h3>
          {ble.simulation ? <span className="rounded-full bg-warn/20 px-3 py-1 text-xs text-warn">SIMULATION MODE</span> : null}
        </div>
        <p className="mt-2 text-sm text-muted">Detected nearby devices indicate possible survivor signals.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {ble.devices.map((d) => (
            <div key={d.id} className="rounded-lg border border-border bg-white/5 p-2">
              <p className="text-sm font-semibold text-live">{d.name}</p>
              <p className="text-xs text-muted">~{d.distanceMeters}m away</p>
            </div>
          ))}
        </div>
      </Card>
    </motion.main>
  );
}
