import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, Popup, TileLayer } from "react-leaflet";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import { api } from "../services/api";
import useSimulationFeed from "../hooks/useSimulationFeed";

// ── Same hardcoded Odisha markers as Dashboard/LiveMap ────────────────────────
const DEMO_ZONES = [
  { id: "demo-bhubaneswar", center: [20.2961, 85.8245], radius: 8000,  color: "#FF3B30", fillOpacity: 0.3,  label: "Bhubaneswar SOS Zone" },
  { id: "demo-puri",        center: [19.8135, 85.8312], radius: 12000, color: "#FF3B30", fillOpacity: 0.4,  label: "Puri Coastal Impact" },
  { id: "demo-cuttack",     center: [20.4625, 85.8830], radius: 6000,  color: "#F59E0B", fillOpacity: 0.25, label: "Cuttack Warning Zone" },
];

const DEMO_SHELTERS = [
  { id: "shelter-kiit",    position: [20.3500, 85.7800], label: "Shelter: KIIT Campus" },
  { id: "shelter-capital", position: [20.2700, 85.8400], label: "Shelter: Capital Hospital" },
];

function KpiCard({ label, value, color = "text-green-400" }) {
  return (
    <Card>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className={`mt-2 font-mono text-4xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}

export default function AdminPortal() {
  // NO step gate — page always renders
  const token    = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const socket   = useSocket(token);
  useSimulationFeed(socket);
  const demand   = useAppStore((s) => s.volunteerDemand);
  const familySt = useAppStore((s) => s.familyStatus);

  const [stats, setStats] = useState({ activeSOS: 0, deployedVolunteers: 0, familiesReunited: 0 });
  const [data,  setData]  = useState({ alerts: [], volunteers: [], zones: [], shelters: [] });
  const [explanation, setExplanation] = useState("");
  const [routes,      setRoutes]      = useState([]);

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
        volunteers: prev.volunteers.map((v) =>
          String(v._id) === String(volunteerId) ? { ...v, status: "assigned" } : v
        ),
      }));
    });
    return () => {
      socket.off("sos:new");
      socket.off("volunteer:assigned");
    };
  }, [socket]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-7xl space-y-4 p-4"
    >
      <h2 className="font-heading text-2xl uppercase tracking-wide">Command Centre</h2>

      {/* ── 3 KPIs only ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Active SOS"          value={stats.activeSOS || 0}        color="text-red-400" />
        <KpiCard label="Assigned Volunteers" value={demand.assigned}             color="text-amber-400" />
        <KpiCard label="Families Reunited"   value={familySt.reunitedCount || 0} color="text-green-400" />
      </div>

      {/* ── Map + AI panel ───────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="map-shell lg:col-span-2 h-[460px]">
          <MapContainer
            center={[20.2961, 85.8245]}
            zoom={9}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />

            {/* Hardcoded demo zones — always visible */}
            {DEMO_ZONES.map((zone) => (
              <Circle
                key={zone.id}
                center={zone.center}
                radius={zone.radius}
                pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: zone.fillOpacity, weight: 2 }}
              >
                <Popup>{zone.label}</Popup>
              </Circle>
            ))}

            {/* Hardcoded shelter markers — always visible */}
            {DEMO_SHELTERS.map((s) => (
              <CircleMarker
                key={s.id}
                center={s.position}
                radius={10}
                pathOptions={{ color: "#4DDA98", fillColor: "#4DDA98", fillOpacity: 0.85, weight: 2 }}
              >
                <Popup>{s.label}</Popup>
              </CircleMarker>
            ))}

            {/* Live SOS alerts from simulation */}
            {data.alerts.map((a, idx) => (
              <Circle
                key={`sos-${idx}`}
                center={[a.location?.coordinates?.[1] || 20.2961, a.location?.coordinates?.[0] || 85.8245]}
                radius={300}
                pathOptions={{ color: "#FF4500", fillColor: "#FF4500", fillOpacity: 0.22 }}
              />
            ))}

            {/* Live disaster zones from simulation */}
            {data.zones.map((z) =>
              z.polygon?.length ? (
                <Polygon
                  key={z._id}
                  positions={z.polygon.map((p) => [p[1], p[0]])}
                  pathOptions={{ color: z.severity === "HIGH" ? "#FF4500" : "#F59E0B" }}
                />
              ) : null
            )}

            {/* Live volunteer markers */}
            {data.volunteers.map((v) => (
              <Marker
                key={v._id}
                position={[v.location?.coordinates?.[1] || 20.2961, v.location?.coordinates?.[0] || 85.8245]}
              >
                <Popup>{v.userId?.name || "Volunteer"}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </Card>

        <div className="space-y-4">
          {/* AI Decision */}
          <Card>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">AI Decision</p>
            <Button
              className="mt-3 h-10 min-w-0 w-full text-sm"
              variant="ghost"
              onClick={async () => {
                const res = await api.aiExplain("resource_prediction", data.zones?.[0]?.aiPrediction || {});
                setExplanation(res.explanation || "AI prioritises high-risk zones. Volunteers assigned by proximity and skill score. Routes optimised for current flood levels.");
              }}
            >
              Explain AI Decision
            </Button>
            {explanation && (
              <p className="mt-3 text-sm leading-relaxed text-muted">{explanation}</p>
            )}
            {!explanation && (
              <p className="mt-3 text-sm text-muted">Click to view AI decision rationale.</p>
            )}
          </Card>

          {/* Emergency Routes */}
          <Card>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">Emergency Routes</p>
            <Button
              className="mt-3 h-10 min-w-0 w-full text-sm"
              variant="ghost"
              onClick={async () => {
                const zone = data.zones?.[0];
                const res  = await api.aiTrafficRoute(
                  zone?.polygon || [[85.79, 20.27], [85.87, 20.33]],
                  zone?.disasterType || "Flood"
                );
                setRoutes(res.routes || [{ name: "NH-16 Bypass", etaMinutes: 8 }, { name: "Coastal Road Alt", etaMinutes: 14 }]);
              }}
            >
              Suggest Route
            </Button>
            <div className="mt-3 space-y-1 text-sm">
              {routes.map((r, i) => (
                <p key={i} className="text-muted">
                  {i + 1}. <span className="text-text">{r.name || `Route ${i + 1}`}</span>
                  {r.etaMinutes ? ` · ETA ${r.etaMinutes}m` : ""}
                </p>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.main>
  );
}
