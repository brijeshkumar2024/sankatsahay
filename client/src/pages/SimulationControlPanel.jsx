import { useEffect, useMemo, useState } from "react";
import useSocket from "../hooks/useSocket";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useAppStore from "../store/useAppStore";
import { api } from "../services/api";
import useDemoFlow from "../hooks/useDemoFlow";

const basePanel = {
  intensity: 68,
  sosFrequency: 10,
  simMode: true
};

function pretty(value) {
  return typeof value === "number" ? value.toLocaleString() : value;
}

export default function SimulationControlPanel() {
  const isNodeDev = typeof process !== "undefined" && process?.env?.NODE_ENV === "development";
  const isAuthorized = isNodeDev || import.meta.env.DEV || localStorage.getItem("demo_access") === "true";
  const socket = useSocket(null);
  useSimulationFeed(socket);
  const { currentStep, waitingForUser } = useDemoFlow();
  if (!isAuthorized) return null;

  const simulation = useAppStore((s) => s.simulation);
  const adminKpi = useAppStore((s) => s.adminKpi);
  const volunteerDemand = useAppStore((s) => s.volunteerDemand);
  const familyStatus = useAppStore((s) => s.familyStatus);
  const resources = useAppStore((s) => s.resources);
  const broadcast = useAppStore((s) => s.broadcastAlert);
  const [panel, setPanel] = useState(basePanel);
  const [status, setStatus] = useState("Awaiting operator command");

  useEffect(() => {
    api.getSimulationState()
      .then((state) => {
        setPanel((prev) => ({
          ...prev,
          intensity: state.intensity ?? prev.intensity,
          sosFrequency: state.sosFrequency ?? prev.sosFrequency,
          simMode: state.simMode ?? prev.simMode
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setStatus("Live connection established");
    const onDisconnect = () => setStatus("Socket disconnected - reconnecting...");

    if (socket.connected) {
      setStatus("Live connection established");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  const send = async (command, payload = {}) => {
    if (socket?.connected) {
      socket.emit(command, payload);
      setStatus(`${command} dispatched via socket`);
      return;
    }
    try {
      await api.sendSimulationCommand(command, payload);
      setStatus(`${command} dispatched via API`);
    } catch {
      setStatus(`${command} failed: backend unreachable`);
    }
  };

  const handleReset = async () => {
    // 1. Emit via socket (fastest path — all connected clients react immediately)
    if (socket?.connected) {
      socket.emit("simulate:reset");
    }
    // 2. Also call API so server state resets even if socket drops
    try {
      await api.sendSimulationCommand("simulate:reset", {});
    } catch {
      // Server may already have reset via socket — not fatal
    }
    // 3. Reset local sim-control panel state
    setPanel(basePanel);
    setStatus("Demo reset. System ready.");
  };

  const runDemoStep = (step) => {
    if (socket?.connected) {
      socket.emit("demo:run-step", { step });
      setStatus(`demo step ${step} dispatched`);
      return;
    }
    setStatus(`demo step ${step} queued - socket unavailable`);
  };

  const commandPayload = useMemo(
    () => ({
      intensity: panel.intensity,
      sosFrequency: panel.sosFrequency
    }),
    [panel.intensity, panel.sosFrequency]
  );

  return (
    <main className="sim-control-shell min-h-screen p-4 text-text">
      <div className="mx-auto max-w-6xl">
        <header className="sim-header">
          <div>
            <p className="sim-kicker">Hidden Operator Tool</p>
            <h1>Disaster Simulation Control Panel</h1>
            <p className="sim-subtitle">Scenario: Cyclone {"->"} Flood {"->"} Panic Situation</p>
          </div>
          <div className="sim-clock">
            <p>STATUS</p>
            <strong>{status}</strong>
            <span>{new Date(simulation.timestamp || Date.now()).toLocaleTimeString()}</span>
          </div>
        </header>

        <section className="sim-grid mt-4">
          <article className="sim-block">
            <h2>Demo Step Orchestrator</h2>
            <div className="sim-actions">
              <button onClick={() => runDemoStep("cyclone")}>Step: Cyclone</button>
              <button onClick={() => runDemoStep("sos")}>Step: SOS</button>
              <button onClick={() => runDemoStep("panic")}>Step: Panic</button>
              <button onClick={() => runDemoStep("family")}>Step: Family</button>
              <button onClick={() => runDemoStep("volunteer")}>Step: Volunteer</button>
              <button onClick={() => runDemoStep("resolution")}>Step: Resolution</button>
            </div>
            <div className="mt-3 rounded-lg border border-border p-2 text-sm">
              Current step: <strong>{currentStep}</strong> | waiting:{" "}
              <strong>{waitingForUser ? "user action" : "ready"}</strong>
            </div>
          </article>

          <article className="sim-block">
            <h2>Scenario Commands</h2>
            <div className="sim-actions">
              <button onClick={() => send("simulate:cyclone", { ...commandPayload, phase: 1, windSpeedKmph: 138 })}>Start Cyclone</button>
              <button onClick={() => send("simulate:flood", { ...commandPayload, phase: 2, waterLevelMeters: simulation.floodLevel + 0.7 })}>
                Increase Flood Level
              </button>
              <button onClick={() => send("simulate:panic", { ...commandPayload, phase: 3, panicIndex: Math.max(82, simulation.panicIndex) })}>
                Trigger Panic Zone
              </button>
              <button className="danger" onClick={handleReset}>Reset Demo</button>
            </div>
            <div className="sim-actions mt-3">
              <button onClick={() => send("simulate:story:play")}>Play Story Mode</button>
            </div>
          </article>

          <article className="sim-block">
            <h2>Simulation Mode</h2>
            <label htmlFor="intensity">Disaster intensity: {panel.intensity}</label>
            <input
              id="intensity"
              type="range"
              min="20"
              max="100"
              value={panel.intensity}
              onChange={(e) => setPanel((prev) => ({ ...prev, intensity: Number(e.target.value) }))}
            />
            <label htmlFor="frequency">SOS frequency: {panel.sosFrequency}/min</label>
            <input
              id="frequency"
              type="range"
              min="2"
              max="24"
              value={panel.sosFrequency}
              onChange={(e) => setPanel((prev) => ({ ...prev, sosFrequency: Number(e.target.value) }))}
            />
            <div className="sim-toggle">
              <span>Simulation Mode</span>
              <button
                className={panel.simMode ? "on" : "off"}
                onClick={() => {
                  const next = !panel.simMode;
                  setPanel((prev) => ({ ...prev, simMode: next }));
                  send("simulate:config:update", { ...commandPayload, simMode: next });
                }}
              >
                {panel.simMode ? "ON" : "OFF"}
              </button>
            </div>
            <button className="full" onClick={() => send("simulate:config:update", { ...commandPayload, simMode: panel.simMode })}>
              Apply Slider Config
            </button>
          </article>

          <article className="sim-block">
            <h2>Live Telemetry</h2>
            <ul className="telemetry">
              <li>Phase <strong>{simulation.phase}</strong></li>
              <li>Severity <strong>{simulation.severity}</strong></li>
              <li>Active SOS <strong>{pretty(adminKpi.activeSOS)}</strong></li>
              <li>Panic Index <strong>{pretty(simulation.panicIndex)}</strong></li>
              <li>Volunteer Deficit <strong>{pretty(adminKpi.volunteerDeficit)}</strong></li>
              <li>Family Separated <strong>{pretty(familyStatus.separatedCount)}</strong></li>
            </ul>
            <div className="mt-3 rounded-lg border border-border p-3">
              <p className="text-xs text-muted">Broadcast</p>
              <p className="mt-1 text-sm">{broadcast.message}</p>
            </div>
          </article>
        </section>

        <section className="sim-grid mt-4">
          <article className="sim-block">
            <h2>Resource Pressure</h2>
            <ul className="telemetry">
              <li>Food shortage <strong>{resources.foodShortagePercent}%</strong></li>
              <li>Medical shortage <strong>{resources.medicalShortagePercent}%</strong></li>
              <li>Shelter occupancy <strong>{resources.shelterOccupancyPercent}%</strong></li>
            </ul>
          </article>
          <article className="sim-block">
            <h2>Volunteer Demand</h2>
            <ul className="telemetry">
              <li>Required <strong>{volunteerDemand.required}</strong></li>
              <li>Assigned <strong>{volunteerDemand.assigned}</strong></li>
              <li>Medics needed <strong>{volunteerDemand.medicsNeeded}</strong></li>
              <li>Boats needed <strong>{volunteerDemand.boatsNeeded}</strong></li>
            </ul>
          </article>
          <article className="sim-block">
            <h2>Event Contracts</h2>
            <code className="sim-code">
              simulate:cyclone{"\n"}
              simulate:flood{"\n"}
              simulate:panic{"\n"}
              simulate:reset{"\n"}
              simulate:config:update
            </code>
          </article>
        </section>
      </div>
    </main>
  );
}
