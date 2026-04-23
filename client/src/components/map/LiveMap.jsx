/* eslint-disable react/prop-types */
import { Circle, CircleMarker, Marker, Popup, TileLayer, MapContainer, Tooltip, Polyline } from "react-leaflet";
import Card from "../ui/Card";
import useActiveAnimation from "../../hooks/useActiveAnimation";

// ── HARDCODED demo center — always Odisha coast, never GPS ───────────────────
const ODISHA_CENTER = [20.2961, 85.8245];
const ODISHA_ZOOM   = 9;

// ── Hardcoded demo markers — visible from second 1, no sim-control needed ────
const DEMO_ZONES = [
  {
    id:          "demo-bhubaneswar",
    center:      [20.2961, 85.8245],
    radius:      8000,
    color:       "#FF3B30",
    fillOpacity: 0.3,
    label:       "Bhubaneswar SOS Zone",
    severity:    "CRITICAL",
  },
  {
    id:          "demo-puri",
    center:      [19.8135, 85.8312],
    radius:      12000,
    color:       "#FF3B30",
    fillOpacity: 0.4,
    label:       "Puri Coastal Impact",
    severity:    "CRITICAL",
  },
  {
    id:          "demo-cuttack",
    center:      [20.4625, 85.8830],
    radius:      6000,
    color:       "#F59E0B",
    fillOpacity: 0.25,
    label:       "Cuttack Warning Zone",
    severity:    "WARNING",
  },
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

/**
 * activeAnimation — only ONE animation runs at a time:
 *   "cyclone-pulse"   → risk zones breathe
 *   "sos-pulse"       → SOS markers pulse
 *   "route-highlight" → evac route visible
 *   null              → no animation
 *
 * Map center is ALWAYS Odisha coast [20.2961, 85.8245] at zoom 9.
 * navigator.geolocation is NOT used here.
 */
export default function LiveMap({ pins = [], riskZones = [], phase = 0, activeAnimation = null }) {
  const animation = useActiveAnimation();

  const showRiskPulse = animation.riskPulse || activeAnimation === "cyclone-pulse";
  const showSOSPulse  = animation.sosPulse  || activeAnimation === "sos-pulse";
  const showRoute     = activeAnimation === "route-highlight" || phase >= 2;

  return (
    <Card className="map-shell h-[480px] p-3">
      <MapContainer
        center={ODISHA_CENTER}
        zoom={ODISHA_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ── Hardcoded demo zones — always visible ─────────────────────── */}
        {DEMO_ZONES.map((zone) => (
          <Circle
            key={zone.id}
            center={zone.center}
            radius={zone.radius}
            pathOptions={{
              color:       zone.color,
              fillColor:   zone.color,
              fillOpacity: zone.fillOpacity,
              weight:      2,
              className:   showRiskPulse ? "radar-zone" : "",
            }}
          >
            <Tooltip direction="top" permanent={false}>
              {zone.label} · {zone.severity}
            </Tooltip>
          </Circle>
        ))}

        {/* ── Hardcoded shelter markers — always visible ────────────────── */}
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

        {/* ── Live risk zones from simulation ───────────────────────────── */}
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
            <Tooltip direction="top">
              {zone.name} · {zone.severity}
            </Tooltip>
          </Circle>
        ))}

        {/* ── Live SOS / volunteer pins from simulation ─────────────────── */}
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

        {/* ── Evac route — only when route animation or phase ≥ 2 ─────── */}
        {showRoute && (
          <Polyline
            positions={[
              [20.35, 85.72],
              [20.52, 85.90],
              [20.70, 86.10],
            ]}
            pathOptions={{ color: "#79D4FF", weight: 3, dashArray: "8 7" }}
          />
        )}
      </MapContainer>
    </Card>
  );
}
