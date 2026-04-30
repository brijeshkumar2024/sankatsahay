import Card from "../ui/Card";

function Kpi({ label, value, tone = "text-live", icon = "" }) {
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
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Live Metrics</h2>
        <div className="flex items-center gap-2 rounded-full border border-live/40 bg-live/10 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-live animate-pulse"></span>
          <span className="text-xs font-semibold text-live">LIVE</span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Active SOS" value={stats.activeSOS || 0} tone="text-alert" icon="🆘" />
        <Kpi label="Volunteers Assigned" value={stats.deployedVolunteers || 0} tone="text-warn" icon="👥" />
        <Kpi label="Families Reunited" value={stats.familiesReunited || 0} tone="text-safe" icon="👨‍👩‍👧" />
        <Kpi label="Predicted Resource Zones" value={stats.resourcesPredicted || 0} tone="text-live" icon="📍" />
      </div>
    </section>
  );
}
