import Card from "../ui/Card";

export default function RiskZoneLayer({ zone }) {
  return (
    <Card>
      <p className="text-xs uppercase text-muted">Active Zone</p>
      <h4 className="mt-1 font-heading text-lg text-alert">{zone?.name || "Cuttack Flood Zone"}</h4>
      <p className="text-sm text-muted">Severity: {zone?.severity || "HIGH"}</p>
    </Card>
  );
}
