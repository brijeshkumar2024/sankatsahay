import Card from "../ui/Card";

function Kpi({ label, value, tone = "text-live" }) {
  return (
    <Card>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className={`mt-2 font-mono text-3xl font-bold ${tone}`}>{value}</p>
    </Card>
  );
}

export default function RealTimeDashboard({ stats, loading }) {
  if (loading) {
    return <p className="text-sm text-muted">Loading real-time dashboard data...</p>;
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi label="Active SOS" value={stats.activeSOS || 0} tone="text-alert" />
      <Kpi label="Volunteers Assigned" value={stats.deployedVolunteers || 0} tone="text-warn" />
      <Kpi label="Families Reunited" value={stats.familiesReunited || 0} tone="text-safe" />
      <Kpi label="Predicted Resource Zones" value={stats.resourcesPredicted || 0} tone="text-live" />
    </section>
  );
}
