import { Circle, Marker, Popup, TileLayer, MapContainer, Tooltip, Polyline } from "react-leaflet";
import Card from "../ui/Card";

function getColor(level) {
  if (level === "panic" || level === "critical") return "#FF3B30";
  if (level === "high") return "#C4451C";
  if (level === "warning" || level === "watch") return "#A56A00";
  return "#4DDA98";
}

function normalizeRisk(value = "safe") {
  return String(value).toLowerCase();
}

export default function LiveMap({ pins = [], riskZones = [], phase = 0 }) {
  return (
    <Card className="map-shell h-[520px] p-3">
      <MapContainer center={[21.3, 86.5]} zoom={7} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {riskZones.map((zone) => (
          <Circle
            key={zone.id}
            center={zone.center}
            radius={zone.radiusMeters}
            pathOptions={{
              color: zone.color || getColor(normalizeRisk(zone.severity)),
              fillColor: zone.color || getColor(normalizeRisk(zone.severity)),
              fillOpacity: zone.blink ? 0.42 : 0.26,
              className: zone.blink ? "radar-zone" : ""
            }}
          >
            <Tooltip direction="top">
              {zone.name} | {zone.severity} | intensity {zone.intensity}
            </Tooltip>
          </Circle>
        ))}

        {pins.slice(0, 40).map((pin) => (
          <Circle
            key={`${pin.id}-ring`}
            center={pin.coords}
            radius={pin.type === "sos" ? 450 : 220}
            pathOptions={{
              color: getColor(normalizeRisk(pin.risk)),
              fillColor: getColor(normalizeRisk(pin.risk)),
              fillOpacity: pin.type === "sos" ? 0.28 : 0.2
            }}
          />
        ))}

        {pins.slice(0, 40).map((pin) => (
          <Marker key={pin.id} position={pin.coords}>
            <Popup>
              {pin.type.toUpperCase()} | {pin.risk}
              <br />
              {pin.mode ? `mode: ${pin.mode}` : "tracked signal"}
            </Popup>
          </Marker>
        ))}

        {phase >= 2 ? (
          <Polyline
            positions={[
              [20.35, 85.72],
              [20.52, 85.9],
              [20.7, 86.1]
            ]}
            pathOptions={{ color: "#79D4FF", weight: 3, dashArray: "8 7" }}
          />
        ) : null}
      </MapContainer>
    </Card>
  );
}
