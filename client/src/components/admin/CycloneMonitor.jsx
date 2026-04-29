import { useEffect, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { api } from "../../services/api";

export default function CycloneMonitor() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alertMsg, setAlertMsg] = useState("Cyclone alert from admin panel");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getCycloneAdminState();
      setState(data);
    } catch (err) {
      setError(err.message || "Failed to load cyclone state");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSimMode = async () => {
    if (!state) return;
    await api.sendSimulationCommand("config:update", { simMode: !state.simMode });
    await load();
  };

  const triggerAlert = async () => {
    await api.triggerCycloneAlert({ message: alertMsg, severity: "CRITICAL", zoneId: state?.activeZone });
    await load();
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-xl uppercase tracking-wide">Cyclone Monitoring</h3>
        <Button className="h-9 min-w-0 px-3 text-xs" variant="ghost" onClick={load}>Refresh</Button>
      </div>

      {loading && <p className="text-sm text-muted">Loading cyclone state...</p>}
      {error && <p className="rounded-lg border border-alert/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}

      {state && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-white/5 p-3 text-sm">Severity: <span className="text-alert">{state.severity}</span></div>
            <div className="rounded-lg border border-border bg-white/5 p-3 text-sm">Intensity: <span className="text-warn">{state.intensity}</span></div>
            <div className="rounded-lg border border-border bg-white/5 p-3 text-sm">Flood level: <span className="text-live">{state.floodLevel}</span></div>
            <div className="rounded-lg border border-border bg-white/5 p-3 text-sm">Sim mode: <span className="text-safe">{state.simMode ? "ON" : "OFF"}</span></div>
          </div>

          <div className="rounded-lg border border-border bg-white/5 p-3">
            <p className="text-xs uppercase tracking-widest text-muted">Risk Zones</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(state.zones || []).map((zone) => (
                <div key={zone.id} className="rounded border border-border px-2 py-1 text-sm">
                  <p className="font-semibold">{zone.name}</p>
                  <p className="text-xs text-muted">Severity: {zone.severity} · Intensity: {zone.intensity}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white/5 p-3">
            <p className="text-xs uppercase tracking-widest text-muted">Predicted Impact</p>
            <p className="mt-2 text-sm text-text">{state.broadcast}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="h-9 min-w-0 px-3 text-xs" variant="ghost" onClick={toggleSimMode}>
              Toggle Simulation Mode
            </Button>
            <input
              value={alertMsg}
              onChange={(e) => setAlertMsg(e.target.value)}
              className="min-w-[220px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Alert message"
            />
            <Button className="h-9 min-w-0 px-3 text-xs" variant="danger" onClick={triggerAlert}>
              Trigger Alert
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
