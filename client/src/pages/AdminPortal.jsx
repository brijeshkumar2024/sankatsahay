import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, Popup, TileLayer } from "react-leaflet";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import { api } from "../services/api";
import useSimulationFeed from "../hooks/useSimulationFeed";

function AnimatedStat({ label, value }) {
  const mv = useMotionValue(value || 0);
  const spring = useSpring(mv, { stiffness: 120, damping: 20 });
  const [display, setDisplay] = useState(value || 0);

  useEffect(() => {
    mv.set(value || 0);
  }, [value]);

  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-mono text-3xl text-live">{display}</p>
    </Card>
  );
}

export default function AdminPortal() {
  const token = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const socket = useSocket(token);
  useSimulationFeed(socket);
  const simulation = useAppStore((s) => s.simulation);
  const broadcast = useAppStore((s) => s.broadcastAlert);
  const [stats, setStats] = useState({ activeSOS: 0, deployedVolunteers: 0, familiesReunited: 0, resourcesPredicted: 0 });
  const [data, setData] = useState({ alerts: [], volunteers: [], zones: [], shelters: [], sensors: [], users: [] });
  const [explanation, setExplanation] = useState("");
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    api.getAdminStats().then(setStats).catch(() => {});
    api.getAdminDashboardData().then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join:admin");
    socket.on("sos:new", (event) => {
      setData((prev) => ({ ...prev, alerts: [event, ...prev.alerts] }));
      setStats((prev) => ({ ...prev, activeSOS: prev.activeSOS + 1 }));
    });
    socket.on("volunteer:assigned", ({ volunteerId }) => {
      setData((prev) => ({
        ...prev,
        volunteers: prev.volunteers.map((v) => (String(v._id) === String(volunteerId) ? { ...v, status: "assigned" } : v))
      }));
    });
    socket.on("emotion:update", ({ userId, state, confidence }) => {
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (String(u._id) === String(userId) ? { ...u, emotionState: { state, confidence } } : u))
      }));
    });
    socket.on("bluetooth:ping", (ping) => {
      setData((prev) => ({ ...prev, sensors: [ping, ...prev.sensors] }));
    });
    socket.on("sensor:distress", (distress) => {
      setData((prev) => ({ ...prev, sensors: [distress, ...prev.sensors] }));
    });

    return () => {
      socket.off("sos:new");
      socket.off("volunteer:assigned");
      socket.off("emotion:update");
      socket.off("bluetooth:ping");
      socket.off("sensor:distress");
    };
  }, [socket]);

  const center = useMemo(() => {
    const z = data.zones?.[0]?.center?.coordinates;
    return z ? [z[1], z[0]] : [20.2961, 85.8245];
  }, [data.zones]);

  return (
    <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mx-auto max-w-7xl p-4 ${simulation.phase >= 3 ? "panic-ui" : ""}`}>
      <div className="broadcast-banner mb-4 rounded-xl px-4 py-3">
        <p className="text-xs text-red-100">NATIONAL RESPONSE FEED :: PHASE {simulation.phase} :: {simulation.severity}</p>
        <p className="mt-1 text-sm text-white">{broadcast.message}</p>
      </div>
      <h2 className="font-heading text-3xl">Admin Command Center</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <AnimatedStat label="Active SOS count" value={stats.activeSOS} />
        <AnimatedStat label="Volunteers deployed" value={stats.deployedVolunteers} />
        <AnimatedStat label="Survivors confirmed" value={stats.familiesReunited} />
        <AnimatedStat label="Resources dispatched" value={stats.resourcesPredicted} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="map-shell lg:col-span-2 h-[520px]">
          <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {data.alerts.map((a, idx) => (
              <Circle key={`sos-${idx}`} center={[a.location?.coordinates?.[1] || a.lat || 20.2961, a.location?.coordinates?.[0] || a.lng || 85.8245]} radius={300} pathOptions={{ color: "#FF4500", fillColor: "#FF4500", fillOpacity: 0.25 }} />
            ))}
            {data.volunteers.map((v) => (
              <Marker key={v._id} position={[v.location?.coordinates?.[1] || 20.2961, v.location?.coordinates?.[0] || 85.8245]}>
                <Popup>{v.userId?.name || "Volunteer"}</Popup>
              </Marker>
            ))}
            {data.zones.map((z) => (
              z.polygon?.length ? <Polygon key={z._id} positions={z.polygon.map((p) => [p[1], p[0]])} pathOptions={{ color: z.severity === "HIGH" ? "#FF4500" : "#F59E0B" }} /> : null
            ))}
            {data.shelters.map((s) => (
              <CircleMarker key={s._id} center={[s.location.coordinates[1], s.location.coordinates[0]]} radius={8} pathOptions={{ color: "#10B981" }}>
                <Popup>{s.name} | Capacity {s.currentOccupancy}/{s.capacity}</Popup>
              </CircleMarker>
            ))}
            {data.sensors.map((s, idx) => (
              <CircleMarker key={`ble-${idx}`} center={[s.location?.coordinates?.[1] || s.lat || 20.2961, s.location?.coordinates?.[0] || s.lng || 85.8245]} radius={6} pathOptions={{ color: "#00D4FF" }}>
                <Popup>{s.label || "BLE signal"}</Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="text-sm text-muted">AI Explanation</p>
            <Button className="mt-3" variant="ghost" onClick={async () => {
              const res = await api.aiExplain("resource_prediction", data.zones?.[0]?.aiPrediction || {});
              setExplanation(res.explanation || "No explanation available");
            }}>Explain</Button>
            <p className="mt-3 text-sm">{explanation || "Click Explain to view AI decision rationale."}</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">AI Traffic Clearance</p>
            <Button className="mt-3" variant="ghost" onClick={async () => {
              const zone = data.zones?.[0];
              const res = await api.aiTrafficRoute(zone?.polygon || [[85.79, 20.27], [85.87, 20.33]], zone?.disasterType || "Flood");
              setRoutes(res.routes || []);
            }}>Suggest Emergency Route</Button>
            <div className="mt-3 space-y-2 text-sm">
              {routes.map((r, i) => <p key={i}>{i + 1}. {r.name || `Route ${i + 1}`} (ETA: {r.etaMinutes || "-"}m)</p>)}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">AI Transparency</p>
          <p className="mt-2">Model: NVIDIA ({import.meta.env.VITE_NVIDIA_MODEL || "openai/gpt-oss-120b"})</p>
          <p>Confidence: {data.zones?.[0]?.aiPrediction?.confidence || "N/A"}</p>
          <p>Sources: {(data.zones?.[0]?.aiPrediction?.sources || []).join(", ") || "N/A"}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Live User Emotion States</p>
          <div className="mt-2 space-y-2">
            {data.users.slice(0, 6).map((u) => (
              <p key={u._id} className="text-sm">{u.name}: <span className="text-live">{u.emotionState?.state || "CALM"}</span></p>
            ))}
          </div>
        </Card>
      </div>
    </motion.main>
  );
}
