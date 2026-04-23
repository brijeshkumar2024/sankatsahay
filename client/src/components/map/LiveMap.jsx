import { Circle, Marker, Popup, TileLayer, MapContainer, Tooltip, Polyline } from "react-leaflet";
import Card from "../ui/Card";
import useDemoFlow from "../../hooks/useDemoFlow";
import useActiveAnimation from "../../hooks/useActiveAnimation";

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
 */
export default function LiveMap({ pins = [], riskZones = [], phase = 0, activeAnimation = null }) {
  const { currentStep } = useDemoFlow();
  const animation = useActiveAnimation();
  if (currentStep !== "cyclone") return null;

  const showRiskPulse = animation.riskPulse || activeAnimation === "cyclone-pulse";
  const showSOSPulse = animation.sosPulse || activeAnimation === "sos-pulse";
  const showRoute = (activeAnimation === "route-highlight" || phase >= 2) && showRiskPulse;

  return (
    <Card className="map-shell h-[480px] p-3">
      <MapContainer center={[21.3, 86.5]} zoom={7} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Risk zones — pulse ONLY when cyclone animation is active */}
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

        {/* Map pins — SOS pulse ONLY when sos animation is active */}
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

        {/* Evac route — only when route animation or phase ≥ 2 */}
        {showRoute ? (
          <Polyline
            positions={[
              [20.35, 85.72],
              [20.52, 85.9],
              [20.7,  86.1],
            ]}
            pathOptions={{ color: "#79D4FF", weight: 3, dashArray: "8 7" }}
          />
        ) : null}
      </MapContainer>
    </Card>
  );
}
