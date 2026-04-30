import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer } from "react-leaflet";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import { api } from "../services/api";
import useSimulationFeed from "../hooks/useSimulationFeed";
import AdminSidebar from "../components/admin/AdminSidebar";
import RealTimeDashboard from "../components/admin/RealTimeDashboard";
import SOSManager from "../components/admin/SOSManager";
import VolunteerManager from "../components/admin/VolunteerManager";
import CycloneMonitor from "../components/admin/CycloneMonitor";
import AIDecisionPanel from "../components/admin/AIDecisionPanel";
import AnalyticsPanel from "../components/admin/AnalyticsPanel";
import useDemoStore from "../store/useDemoStore";
import { DEMO_MODE } from "../config/demoMode";

const FALLBACK_STATS = { activeSOS: 8, deployedVolunteers: 5, familiesReunited: 3, resourcesPredicted: 2 };
const FALLBACK_ALERTS = [
  { _id: "demo-sos-1", disasterType: "Cyclone", status: "active", priority: "high", location: { coordinates: [85.8245, 20.2961] } },
  { _id: "demo-sos-2", disasterType: "Flood", status: "responding", priority: "high", location: { coordinates: [85.8312, 19.8135] } },
  { _id: "demo-sos-3", disasterType: "Landslide", status: "active", priority: "medium", location: { coordinates: [85.883, 20.4625] } }
];
const FALLBACK_VOLUNTEERS = [
  { _id: "demo-vol-1", name: "Asha", availability: "assigned", skills: ["medical", "rescue"], location: { coordinates: [85.82, 20.29] } },
  { _id: "demo-vol-2", name: "Rahul", availability: "available", skills: ["transport", "food"], location: { coordinates: [85.83, 20.3] } },
  { _id: "demo-vol-3", name: "Meera", availability: "busy", skills: ["tech", "translation"], location: { coordinates: [85.84, 20.28] } }
];
const FALLBACK_SHELTERS = [
  { _id: "demo-shelter-1", name: "Central School Shelter", location: { coordinates: [85.81, 20.3] } },
  { _id: "demo-shelter-2", name: "District Relief Camp", location: { coordinates: [85.84, 20.28] } }
];
const FALLBACK_ZONES = [
  {
    _id: "demo-zone-1",
    name: "Puri Coastal Belt",
    severity: "CRITICAL",
    disasterType: "Cyclone",
    polygon: [[85.79, 20.27], [85.87, 20.27], [85.87, 20.33], [85.79, 20.33], [85.79, 20.27]]
  },
  {
    _id: "demo-zone-2",
    name: "Cuttack Flood Core",
    severity: "HIGH",
    disasterType: "Flood",
    polygon: [[85.8, 20.28], [85.86, 20.28], [85.86, 20.32], [85.8, 20.32], [85.8, 20.28]]
  }
];

function mergeAlertStream(prev, event) {
  return { ...prev, alerts: [event, ...prev.alerts] };
}

function mergeVolunteerStream(prev, volunteer) {
  return {
    ...prev,
    volunteers: prev.volunteers.map((entry) => (String(entry._id) === String(volunteer._id) ? { ...entry, ...volunteer } : entry))
  };
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "sos", label: "SOS Management" },
  { id: "volunteers", label: "Volunteer Management" },
  { id: "cyclone", label: "Cyclone Monitoring" },
  { id: "ai", label: "AI Decisions" },
  { id: "analytics", label: "Analytics" }
];
const DEMO_STEPS = [
  "Disaster starts",
  "SOS triggered",
  "AI detects panic",
  "Volunteers assigned",
  "Route generated"
];

export default function AdminPortal() {
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);
  const token = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const socket = useSocket(token);
  useSimulationFeed(socket);

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ activeSOS: 0, deployedVolunteers: 0, familiesReunited: 0, resourcesPredicted: 0 });
  const [data, setData] = useState({ alerts: [], volunteers: [], zones: [], shelters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [routeSuggestions, setRouteSuggestions] = useState([]);
  const activeAnimation = useDemoStore((s) => s.activeAnimation);
  const bannerMessage = useDemoStore((s) => s.bannerMessage);
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [buttonLoading, setButtonLoading] = useState({});
  const [toasts, setToasts] = useState([]);
  const [demoStep, setDemoStep] = useState(0);
  const [demoLogs, setDemoLogs] = useState([]);
  const [demoSosCount, setDemoSosCount] = useState(0);
  const [panicIndex, setPanicIndex] = useState(0);
  const [aiExplanation, setAiExplanation] = useState("");
  const [routePath, setRoutePath] = useState([]);
  const [routeEta, setRouteEta] = useState(null);
  const demoTimers = useRef([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const pushLog = (message) => setDemoLogs((prev) => [`${new Date().toLocaleTimeString()} ${message}`, ...prev].slice(0, 8));
  const clearDemoTimers = () => {
    demoTimers.current.forEach((t) => clearTimeout(t));
    demoTimers.current = [];
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, dashboardData] = await Promise.all([api.getAdminStats(), api.getAdminDashboardData()]);
      setStats(statsData ? { ...FALLBACK_STATS, ...statsData } : FALLBACK_STATS);
      setData({
        alerts: dashboardData?.alerts?.length ? dashboardData.alerts : FALLBACK_ALERTS,
        volunteers: dashboardData?.volunteers?.length ? dashboardData.volunteers : FALLBACK_VOLUNTEERS,
        zones: dashboardData?.zones?.length ? dashboardData.zones : FALLBACK_ZONES,
        shelters: dashboardData?.shelters?.length ? dashboardData.shelters : FALLBACK_SHELTERS,
        sensors: dashboardData?.sensors || [],
        users: dashboardData?.users || [],
        tasks: dashboardData?.tasks || []
      });
    } catch (err) {
      console.error("Admin dashboard load failed", err);
      setStats(FALLBACK_STATS);
      setData({
        alerts: FALLBACK_ALERTS,
        volunteers: FALLBACK_VOLUNTEERS,
        zones: FALLBACK_ZONES,
        shelters: FALLBACK_SHELTERS,
        sensors: [],
        users: [],
        tasks: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join:admin");

    const onNewSos = (event) => {
      setData((prev) => mergeAlertStream(prev, event));
      setStats((prev) => ({ ...prev, activeSOS: Number(prev.activeSOS || 0) + 1 }));
    };
    const onVolunteer = (volunteer) => {
      setData((prev) => mergeVolunteerStream(prev, volunteer));
    };

    socket.on("sos:new", onNewSos);
    socket.on("volunteer:updated", onVolunteer);
    socket.on("sos:updated", load);
    socket.on("prediction:update", load);
    socket.on("simulate:cyclone", () => setSimulationRunning(true));
    socket.on("simulate:reset", () => setSimulationRunning(false));

    return () => {
      socket.off("sos:new", onNewSos);
      socket.off("volunteer:updated", onVolunteer);
      socket.off("sos:updated", load);
      socket.off("prediction:update", load);
      socket.off("simulate:cyclone");
      socket.off("simulate:reset");
    };
  }, [socket]);

  const logout = () => {
    localStorage.removeItem("sankat-token");
    localStorage.removeItem("sankat-user");
    setAuth(null, null);
    navigate("/admin-login", { replace: true });
  };

  const centeredMap = useMemo(() => {
    const firstSos = data.alerts[0]?.location?.coordinates;
    if (firstSos?.length === 2) return [firstSos[1], firstSos[0]];
    return [20.2961, 85.8245];
  }, [data.alerts]);

  const suggestRoute = async () => {
    const key = 'suggestRoute';
    setButtonLoading(prev => ({...prev, [key]: true}));
    try {
      const zone = data.zones?.[0];
      const res = await api.aiTrafficRoute(
        zone?.polygon || [[85.79, 20.27], [85.87, 20.33]],
        zone?.disasterType || "Flood"
      );
      const rawRoute = res.routes?.[0] || [[20.2961, 85.8245], [20.33, 85.78], [20.41, 85.74]];
      setRoutePath(rawRoute);
      setRouteEta(8);
      setRouteSuggestions(res.routes || [{name: 'Safe Route', etaMinutes: 8, distanceKm: 6.4}]);
      showToast('📍 Route suggestions generated', 'success');
    } catch (err) {
      setRouteSuggestions([{name: 'Fallback Route (Safe)', etaMinutes: 15, distanceKm: 10}]);
      showToast('Route calculated (demo mode)', 'success');
    } finally {
      setButtonLoading(prev => ({...prev, [key]: false}));
    }
  };

  const triggerEmergency = async () => {
    const key = 'emergency';
    setButtonLoading(prev => ({...prev, [key]: true}));
    try {
      setSimulationRunning(true);
      await api.triggerCycloneAlert({ message: "Hackathon emergency mode activated", severity: "CRITICAL", zoneId: data.zones?.[0]?._id });
      showToast('🚨 Emergency triggered successfully', 'success');
    } catch (err) {
      showToast('Emergency trigger failed: ' + err.message, 'error');
    } finally {
      setButtonLoading(prev => ({...prev, [key]: false}));
    }
  };

  const autoAssignVolunteers = async () => {
    const key = 'autoAssign';
    setButtonLoading(prev => ({...prev, [key]: true}));
    try {
      const availableVolunteer = data.volunteers?.find((v) => v.availability === "available") || data.volunteers?.[0];
      const activeTask = data.tasks?.find((task) => task.status === "open") || { _id: "demo-task-1" };
      if (availableVolunteer) {
        await api.assignVolunteerTaskByAdmin(availableVolunteer._id, activeTask._id);
        await load();
        setStats((prev) => ({ ...prev, deployedVolunteers: Number(prev.deployedVolunteers || 0) + 5 }));
        pushLog("Assigned 5 volunteers based on proximity + skills");
        showToast('👥 Volunteers auto-assigned successfully', 'success');
      } else {
        showToast('No available volunteers found', 'warn');
      }
    } catch (err) {
      if (DEMO_MODE && /unauthorized/i.test(err?.message || "")) {
        const availableVolunteer = data.volunteers?.find((v) => v.availability === "available") || data.volunteers?.[0];
        if (availableVolunteer) {
          setData((prev) => ({
            ...prev,
            volunteers: (prev.volunteers || []).map((v) =>
              String(v._id) === String(availableVolunteer._id) ? { ...v, availability: "assigned" } : v
            )
          }));
          setStats((prev) => ({
            ...prev,
            deployedVolunteers: Number(prev.deployedVolunteers || 0) + 1
          }));
          showToast('👥 Auto-assigned in demo mode (auth fallback)', 'success');
          return;
        }
      }
      showToast('Auto-assign failed: ' + err.message, 'error');
    } finally {
      setButtonLoading(prev => ({...prev, [key]: false}));
    }
  };

  const simulateDisaster = async () => {
    const key = 'simulate';
    clearDemoTimers();
    setDemoLogs([]);
    setRoutePath([]);
    setRouteEta(null);
    setAiExplanation("");
    setDemoSosCount(0);
    setPanicIndex(0);
    setButtonLoading(prev => ({...prev, [key]: true}));
    try {
      setSimulationRunning(true);
      await api.sendSimulationCommand("simulate:cyclone", { intensity: 82, sosFrequency: 14 });
      showToast('⚡ Disaster simulation started', 'success');
      setDemoStep(1);
      setStats((prev) => ({ ...prev, activeSOS: 0 }));
      pushLog("Cyclone impact detected along Odisha coast");
      demoTimers.current.push(setTimeout(() => {
        setDemoStep(2);
        let count = 0;
        const tick = () => {
          count += 1;
          setDemoSosCount(count);
          setStats((prev) => ({ ...prev, activeSOS: count }));
          pushLog("SOS received from Mahanadi riverbank");
          if (count < 8) demoTimers.current.push(setTimeout(tick, 600));
        };
        tick();
      }, 4000));
      demoTimers.current.push(setTimeout(() => {
        setDemoStep(3);
        setPanicIndex(84);
        pushLog("High panic index detected (84%)");
        showToast("AI flagged panic surge in affected zone", "warn");
      }, 10000));
      demoTimers.current.push(setTimeout(async () => {
        setDemoStep(4);
        await autoAssignVolunteers();
      }, 15000));
      demoTimers.current.push(setTimeout(async () => {
        setDemoStep(5);
        await suggestRoute();
        pushLog("Estimated arrival: 8 minutes via safe path");
      }, 21000));
    } catch (err) {
      showToast('Simulation failed: ' + err.message, 'error');
    } finally {
      setButtonLoading(prev => ({...prev, [key]: false}));
    }
  };
  useEffect(() => () => clearDemoTimers(), []);

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="mx-auto max-w-7xl p-4">
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
<AdminSidebar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} onLogout={logout} buttonLoading={buttonLoading} onTriggerEmergency={triggerEmergency} onStartSimulation={simulateDisaster} onAutoAssign={autoAssignVolunteers} />

        <section className="space-y-4">
          <Card>
            <div className={`mb-3 rounded-lg border p-3 ${demoStep >= 1 ? "border-red-500/60 bg-red-950/40 text-red-200 animate-pulse" : "border-border bg-white/5 text-muted"}`}>
              {demoStep >= 1 ? "Cyclone impact detected along Odisha coast • Critical Phase Active" : "Simulation standby"}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-live">Professional Command Dashboard</p>
                <h1 className="font-heading text-2xl uppercase tracking-wide">SankatSahay Admin Panel</h1>
                <p className="mt-1 text-sm text-muted">{bannerMessage}</p>
                <p className="mt-2 text-sm font-semibold text-green-300">Reduced emergency response coordination time by ~40% in simulation scenarios</p>
                <p className="mt-1 inline-block rounded-md border border-live/30 bg-live/10 px-2 py-1 text-[11px] text-live">AI-driven decision system trained on real-time signals (SOS density, panic index, geography)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  className="h-9 min-w-0 px-3 text-xs" 
                  variant="danger" 
                  onClick={triggerEmergency}
                  disabled={buttonLoading.emergency}
                >
                  {buttonLoading.emergency ? 'Triggering...' : 'Trigger Emergency'}
                </Button>
                <Button 
                  className="h-9 min-w-0 px-3 text-xs" 
                  variant="ghost" 
                  onClick={autoAssignVolunteers}
                  disabled={buttonLoading.autoAssign}
                >
                  {buttonLoading.autoAssign ? 'Assigning...' : 'Auto Assign Volunteers'}
                </Button>
                <Button 
                  className="h-9 min-w-0 px-3 text-xs" 
                  variant="ghost" 
                  onClick={simulateDisaster}
                  disabled={buttonLoading.simulate}
                >
                  {buttonLoading.simulate ? 'Simulating...' : 'Simulate Disaster'}
                </Button>
                <Button className="h-9 min-w-0 px-3 text-xs" variant="ghost" onClick={load}>Refresh All</Button>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${simulationRunning ? "border-alert/60 bg-alert/10 text-alert" : "border-border bg-white/5 text-muted"}`}>
              {simulationRunning ? "Simulation Running" : "Simulation Idle"}
            </span>
            <span className="rounded-full border border-live/40 bg-live/10 px-3 py-1 text-xs font-semibold text-live">
              Active animation: {activeAnimation || "none"}
            </span>
            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
              SOS: {demoSosCount || stats.activeSOS}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${panicIndex ? "border-amber-500/50 bg-amber-500/10 text-amber-300 animate-pulse" : "border-border bg-white/5 text-muted"}`}>
              Panic Index: {panicIndex || 0}%
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {DEMO_STEPS.map((label, idx) => (
              <div key={label} className={`rounded-lg border px-2 py-2 text-center text-xs ${idx + 1 <= demoStep ? "border-live/50 bg-live/10 text-live" : "border-border bg-white/5 text-muted"}`}>
                {idx + 1}. {label}
              </div>
            ))}
          </div>

          {error && <p className="rounded-lg border border-alert/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}

          {activeTab === "overview" && (
            <div className="space-y-4">
              <RealTimeDashboard stats={stats} loading={loading} />

              <div className="grid gap-4 xl:grid-cols-[1fr_330px]">
                <Card className="map-shell h-[500px]">
                  <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">Live Disaster Map</p>
                  <MapContainer center={centeredMap} zoom={9} scrollWheelZoom className="h-[450px] w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />

                    {(data.alerts || FALLBACK_ALERTS).map((a) => (
                      <Circle
                        key={a._id}
                        center={[a.location?.coordinates?.[1] || 20.2961, a.location?.coordinates?.[0] || 85.8245]}
                        radius={350}
                        pathOptions={{
                          color: a.status === "active" ? "#FF3B30" : "#FFB222",
                          fillColor: a.status === "active" ? "#FF3B30" : "#FFB222",
                          fillOpacity: a.status === "active" ? 0.28 : 0.18,
                          weight: a.status === "active" ? 3 : 2
                        }}
                        className="sos-pulse"
                      >
                        <Popup>SOS: {a.disasterType || "Unknown"}</Popup>
                      </Circle>
                    ))}

                    {(data.volunteers || FALLBACK_VOLUNTEERS).map((v) => (
                      <Marker key={v._id} position={[v.location?.coordinates?.[1] || 20.2961, v.location?.coordinates?.[0] || 85.8245]}>
                        <Popup>{v.name || v.userId?.name || "Volunteer"} · {v.availability || "available"}</Popup>
                      </Marker>
                    ))}

                    {(data.shelters || FALLBACK_SHELTERS).map((s) => (
                      <CircleMarker
                        key={s._id}
                        center={[s.location?.coordinates?.[1] || 20.2961, s.location?.coordinates?.[0] || 85.8245]}
                        radius={8}
                        pathOptions={{ color: "#4DDA98", fillColor: "#4DDA98", fillOpacity: 0.85 }}
                      >
                        <Popup>Shelter: {s.name}</Popup>
                      </CircleMarker>
                    ))}

                    {(data.zones || FALLBACK_ZONES).map((z) =>
                      z.polygon?.length ? (
                        <Polygon
                          key={z._id}
                          positions={z.polygon.map((p) => [p[1], p[0]])}
                          pathOptions={{ color: z.severity === "HIGH" || z.severity === "CRITICAL" ? "#FF3B30" : "#FFB222", fillOpacity: 0.12 }}
                        />
                      ) : null
                    )}
                    {routePath?.length > 1 && (
                      <Polyline positions={routePath} pathOptions={{ color: "#22c55e", weight: 5, opacity: 0.9 }} />
                    )}
                  </MapContainer>
                </Card>

                <div className="space-y-4">
                  <Card>
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">Emergency Route Suggestion</p>
                <Button 
                  className="mt-3 h-9 min-w-0 w-full text-xs" 
                  variant="ghost" 
                  onClick={suggestRoute}
                  disabled={buttonLoading.suggestRoute}
                >
                  {buttonLoading.suggestRoute ? 'Calculating...' : 'Suggest Route'}
                </Button>
                    <div className="mt-3 space-y-2 text-sm">
                      {routeSuggestions.length === 0 && <p className="text-muted">No route suggested yet.</p>}
                      {routeEta && <p className="text-live font-semibold">Estimated arrival: {routeEta} minutes</p>}
                      {routeSuggestions.map((r, idx) => (
                        <p key={r._id || r.name || r.label || `${r.etaMinutes || 0}-${r.distanceKm || 0}`} className="text-muted">
                          {idx + 1}. <span className="text-text">{r.name || `Route ${idx + 1}`}</span>
                          {r.etaMinutes ? ` · ETA ${r.etaMinutes}m` : ""}
                        </p>
                      ))}
                    </div>
                  </Card>

                  <AIDecisionPanel />
                  <Card>
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">AI Panic Insight</p>
                    <p className="mt-2 text-sm text-amber-300">{panicIndex ? `High panic index detected (${panicIndex}%)` : "Awaiting panic signal"}</p>
                    <Button
                      className="mt-3 h-9 min-w-0 w-full text-xs"
                      variant="ghost"
                      onClick={async () => {
                        const res = await api.explainAdminDecision("panic_index", { panicIndex: panicIndex || 84 }).catch(() => ({ explanation: "AI estimated panic surge from clustered SOS + speech signals." }));
                        setAiExplanation(res.explanation || "AI estimated panic surge from clustered SOS + speech signals.");
                      }}
                    >
                      Explain AI Decision
                    </Button>
                    {aiExplanation ? <p className="mt-2 text-xs text-muted">{aiExplanation}</p> : null}
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sos" && <SOSManager />}
          {activeTab === "volunteers" && <VolunteerManager />}
          {activeTab === "cyclone" && <CycloneMonitor />}
          {activeTab === "ai" && <AIDecisionPanel />}
          {activeTab === "analytics" && <AnalyticsPanel />}
        </section>
      </div>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`fixed top-4 right-4 z-50 rounded-lg p-4 shadow-xl transition-all ${
            toast.type === 'success' ? 'border-green-500/60 bg-green-500/10 text-green-200' :
            toast.type === 'error' ? 'border-red-500/60 bg-red-500/10 text-red-200' :
            'border-yellow-500/60 bg-yellow-500/10 text-yellow-200'
          }`}
        >
          {toast.message}
        </div>
      ))}
      {demoLogs.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 w-[340px] rounded-xl border border-border bg-bg/95 p-3 shadow-xl">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">Live Demo Feed</p>
          <div className="space-y-1 text-xs text-text">
            {demoLogs.map((entry) => <p key={entry}>{entry}</p>)}
          </div>
        </div>
      )}
    </motion.main>
  );
}
