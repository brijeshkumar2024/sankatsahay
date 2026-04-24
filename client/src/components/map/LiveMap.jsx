/* eslint-disable react/prop-types */
import { Circle, CircleMarker, Marker, Popup, TileLayer, MapContainer, Tooltip, Polyline } from "react-leaflet";
import Card from "../ui/Card";
import useActiveAnimation from "../../hooks/useActiveAnimation";

const ODISHA_CENTER = [20.2961, 85.8245];
const ODISHA_ZOOM   = 9;

const DEMO_ZONES = [
  { id: "demo-bhubaneswar", center: [20.2961, 85.8245], radius: 8000,  label: "Bhubaneswar SOS Zone", severity: "CRITICAL" },
  { id: "demo-puri",        center: [19.8135, 85.8312], radius: 12000, label: "Puri Coastal Impact",  severity: "CRITICAL" },
  { id: "demo-cuttack",     center: [20.4625, 85.8830], radius: 6000,  label: "Cuttack Warning Zone", severity: "WARNING"  },
];

const DEMO_SHELTERS = [
  { id: "shelter-kiit",    position: [20.3500, 85.7800], label: "Shelter: KIIT Campus" },
  { id: "shelter-capital", position: [20.2700, 85.8400], label: "Shelter: Capital Hospital" },
];

function getColor(level) {
  if (level === "panic" || level === "critical") return "#FF3B30";
  if (level === "high")                          return "#C4451C";
  if (level === "warning" || level === "watch")  return "#F59E0B";
  return "#4DDA98";
}

function normalizeRisk(value = "safe") {
  return String(value).toLowerCase();
}

export default function LiveMap({ pins = [], riskZones = [], phase = 0, activeAnimation = null }) {
  const animation = useActiveAnimation();

  const showRiskPulse = animation.riskPulse || activeAnimation === "cyclone-pulse";
  const showSOSPulse  = animation.sosPulse  || activeAnimation === "sos-pulse";
  const showRoute     = activeAnimation === "route-highlight" || phase >= 2;

  // Standby = no active animation → dim gray circles, no pulse
  const isStandby  = !activeAnimation && !animation.riskPulse;
  const zoneColor  = isStandby ? "#6B7280" : "#EF4444";
  const zoneFill   = isStandby ? "#6B7280" : "#EF4444";
  const zoneOpacity = isStandby ? 0.05 : 0.28;
  const zoneWeight  = isStandby ? 1 : 2;

  // Cuttack is warning-level — amber even in active state
  const cuttackColor   = isStandby ? "#6B7280" : "#F59E0B";
  const cuttackOpacity = isStandby ? 0.05 : 0.2;

  return (
    <Card className="map-shell h-[480px] p-3">
      <MapContainer center={ODISHA_CENTER} zoom={ODISHA_ZOOM} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ── Hardcoded demo zones — color/opacity driven by activeAnimation ── */}
        {DEMO_ZONES.map((zone) => {
          const isWarning = zone.severity === "WARNING";
          const color     = isWarning ? cuttackColor   : zoneColor;
          const fillOp    = isWarning ? cuttackOpacity : zoneOpacity;
          return (
            <Circle
              key={zone.id}
              center={zone.center}
              radius={zone.radius}
              pathOptions={{
                color,
                fillColor:   color,
                fillOpacity: fillOp,
                weight:      zoneWeight,
                // Pulse class ONLY when cyclone animation is active
                className:   showRiskPulse ? "radar-zone" : "",
              }}
            >
              <Tooltip direction="top">{zone.label} · {zone.severity}</Tooltip>
            </Circle>
          );
        })}

        {/* ── Shelter markers — always green ───────────────────────────── */}
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

        {/* ── Live risk zones from simulation ──────────────────────────── */}
        {riskZones.map((zone) => (
          <Circle
            key={zone.id}
            center={zone.center}
            radius={zone.radiusMeters}
            pathOptions={{
              color:       zone.color || getColor(normalizeRisk(zone.severity)),
              fillColor:   zone.color || getColor(normalizeRisk(zone.severity)),
              fillOpacity: 0.28,
              className:   showRiskPulse ? "radar-zone" : "",
            }}
          >
            <Tooltip direction="top">{zone.name} · {zone.severity}</Tooltip>
          </Circle>
        ))}

        {/* ── Live SOS / volunteer pins ─────────────────────────────────── */}
        {pins.slice(0, 40).map((pin) => (
          <Circle
            key={`${pin.id}-ring`}
            center={pin.coords}
            radius={pin.type === "sos" ? 450 : 220}
            pathOptions={{
              color:       getColor(normalizeRisk(pin.risk)),
              fillColor:   getColor(normalizeRisk(pin.risk)),
              fillOpacity: pin.type === "sos" ? 0.25 : 0.18,
              className:   showSOSPulse && pin.type === "sos" ? "sos-ring-pulse" : "",
            }}
          />
        ))}

        {pins.slice(0, 40).map((pin) => (
          <Marker key={pin.id} position={pin.coords}>
            <Popup>
              {pin.type.toUpperCase()} · {pin.risk}
              {pin.mode ? ` · ${pin.mode}` : ""}
            </Popup>
          </Marker>
        ))}

        {/* ── Evac route ───────────────────────────────────────────────── */}
        {showRoute && (
          <Polyline
            positions={[[20.35, 85.72], [20.52, 85.90], [20.70, 86.10]]}
            pathOptions={{ color: "#79D4FF", weight: 3, dashArray: "8 7" }}
          />
        )}
      </MapContainer>
    </Card>
  );
}
