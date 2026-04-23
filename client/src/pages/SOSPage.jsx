import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PanicReversal from "../components/ai/PanicReversal";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useDemoFlow from "../hooks/useDemoFlow";
import useActiveAnimation from "../hooks/useActiveAnimation";

export default function SOSPage() {
  const { currentStep, setWaitingForUser } = useDemoFlow();
  if (currentStep !== "sos" && currentStep !== "panic") return null;

  const token = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const socket = useSocket(token);
  useSimulationFeed(socket);
  const simulation = useAppStore((s) => s.simulation);
  const animation = useActiveAnimation();
  const [status, setStatus] = useState("Awaiting manual SOS trigger");
  const [sosTriggered, setSosTriggered] = useState(false);
  const [showCalm, setShowCalm] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const onConfirmed = () => {
      setStatus("SOS confirmed. Help is inbound.");
      setShowCalm(currentStep === "panic");
    };
    socket.on("sos:confirmed", onConfirmed);
    return () => socket.off("sos:confirmed", onConfirmed);
  }, [currentStep, socket]);

  const onManualSOS = () => {
    if (!socket) return;
    socket.emit("demo:user-action", { action: "sos:clicked" });
    setStatus("SOS sent. Verifying distress...");
    setSosTriggered(true);
    setWaitingForUser(false);
    setTimeout(() => {
      socket.emit("demo:run-step", { step: "panic" });
    }, 2200);
  };

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mx-auto max-w-7xl p-4 ${currentStep === "panic" ? "panic-ui" : ""}`}>
      <div className="broadcast-banner mb-4 rounded-xl px-4 py-3">
        <p className="text-xs text-red-100">STEP 2: MANUAL SOS</p>
        <p className="mt-1 text-sm text-white">{status}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 text-center">
          <div className="relative mx-auto w-fit py-6">
            {animation.sosPulse ? <motion.div className="absolute inset-0 rounded-full border-2 border-alert" animate={{ scale: [1, 1.35, 1], opacity: [0.9, 0, 0.9] }} transition={{ duration: 2, repeat: Infinity }} /> : null}
            <button
              onClick={onManualSOS}
              disabled={sosTriggered}
              className="relative h-[200px] w-[200px] rounded-full border border-alert bg-alert text-4xl font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              SOS
            </button>
          </div>
          <p className="text-sm text-muted">Cause {"->"} Effect: click once, then system confirms</p>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => { setWaitingForUser(false); socket?.emit("demo:run-step", { step: "panic" }); }}>Continue to Panic Step</Button>
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase text-muted">Step context</p>
          <p className="mt-2 text-lg text-alert">{currentStep === "sos" ? "SOS Validation" : "Panic Escalation"}</p>
          <p className="mt-2 text-sm text-muted">Panic index: {simulation.panicIndex}</p>
        </Card>
      </div>

      {showCalm || currentStep === "panic" ? <PanicReversal isActive={animation.calmMode} onDismiss={() => setShowCalm(false)} /> : null}
    </motion.main>
  );
}
