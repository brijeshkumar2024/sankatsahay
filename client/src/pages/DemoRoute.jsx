import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import useAppStore from "../store/useAppStore";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { api } from "../services/api";
import useSocket from "../hooks/useSocket";

export default function DemoRoute() {
  const [step, setStep] = useState(0);
  const [events, setEvents] = useState([]);
  const [playing, setPlaying] = useState(true);
  const setAuth = useAppStore((s) => s.setAuth);
  const token = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const socket = useSocket(token);

  const timeline = useMemo(
    () => [
      "0s Auto-login as demo user",
      "2s Silent SOS emitted",
      "4s Emotion set to ANXIOUS",
      "6s Panic reversal starts",
      "10s Family status MISSING -> FOUND",
      "12s BLE simulation appears",
      "15s Volunteer assigned notification",
      "18s AI prediction card shown",
      "22s Admin alert: SOS resolved"
    ],
    []
  );

  const push = (msg) => setEvents((prev) => [msg, ...prev].slice(0, 8));

  const startDemo = async () => {
    setEvents([]);
    setStep(0);
    setPlaying(true);

    const login = await api.login("demo@user.in", "demo123").catch(() => null);
    if (login?.token) {
      localStorage.setItem("sankat-token", login.token);
      setAuth(login.token, login.user);
      push("Demo user authenticated");
    } else {
      setAuth("demo-token", { name: "Demo User", role: "user", familyPin: "NEXORA" });
      localStorage.setItem("sankat-token", "demo-token");
      push("Fallback demo token applied");
    }

    setTimeout(() => {
      setStep(1);
      socket?.emit("sos:silent", { lat: 20.2961, lng: 85.8245, userId: "demo", timestamp: new Date().toISOString() });
      push("Silent SOS triggered");
    }, 2000);
    setTimeout(() => {
      setStep(2);
      socket?.emit("emotion:update", { userId: "demo", state: "ANXIOUS", confidence: 0.82 });
      push("Emotion detected: ANXIOUS");
    }, 4000);
    setTimeout(() => {
      setStep(3);
      push("Panic reversal protocol started");
    }, 6000);
    setTimeout(() => {
      setStep(4);
      socket?.emit("family:status:update", { familyPin: "NEXORA", member: { _id: "riya", name: "Riya", status: "FOUND" } });
      push("Family member found");
    }, 10000);
    setTimeout(() => {
      setStep(5);
      socket?.emit("bluetooth:ping", { lat: 20.301, lng: 85.83, userId: "demo", deviceCount: 2, timestamp: new Date().toISOString(), simulation: true });
      push("BLE simulation: 2 devices detected 45m away");
    }, 12000);
    setTimeout(() => {
      setStep(6);
      socket?.emit("volunteer:assigned", { volunteerId: "vol-1", task: "Flood rescue" });
      push("Volunteer assigned");
    }, 15000);
    setTimeout(() => {
      setStep(7);
      push("AI prediction: 3,200 food parcels needed");
    }, 18000);
    setTimeout(() => {
      setStep(8);
      push("Admin alert: SOS resolved by volunteer");
      setPlaying(false);
    }, 22000);
  };

  useEffect(() => {
    startDemo();
  }, [socket]);

  return (
    <main className="mx-auto max-w-6xl p-4">
      <div className="mb-3 rounded-lg bg-alert/20 p-3 text-alert">DEMO MODE - judge-proof sequence running</div>
      <Card>
        <h2 className="font-heading text-3xl">Demo Timeline</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {timeline.map((item, idx) => (
            <div key={item} className={`rounded-lg p-2 text-sm ${idx <= step ? "bg-live/20 text-live" : "bg-white/5 text-muted"}`}>
              {item}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={startDemo}>Restart Demo</Button>
          <span className="self-center text-sm text-muted">{playing ? "Running..." : "Completed"}</span>
        </div>
      </Card>
      <Card className="mt-4">
        <h3 className="font-heading text-xl">Live Events</h3>
        <div className="mt-3 space-y-2">
          {events.map((e, i) => (
            <motion.div key={`${e}-${i}`} initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }} className="rounded-md bg-white/5 p-2 text-sm">
              {e}
            </motion.div>
          ))}
        </div>
      </Card>
    </main>
  );
}
