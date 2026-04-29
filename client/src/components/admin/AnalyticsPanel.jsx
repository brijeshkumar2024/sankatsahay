/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { api } from "../../services/api";

const palette = ["#79D4FF", "#4DDA98", "#FFB222", "#FF3B30", "#8E1111"];

function BarChartLite({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
          <div className="h-3 rounded-full bg-white/8">
            <div
              className="h-3 rounded-full"
              style={{ width: `${(item.value / max) * 100}%`, background: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutLite({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 25;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-40 w-40 -rotate-90">
        <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        {data.map((item, index) => {
          const pct = (item.value / total) * 100;
          const dash = `${pct * 1.57} 157`;
          const node = (
            <circle
              key={item.name}
              cx="50"
              cy="50"
              r="25"
              fill="none"
              stroke={palette[index % palette.length]}
              strokeWidth="12"
              strokeDasharray={dash}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          );
          offset -= pct * 1.57;
          return node;
        })}
      </svg>
      <div className="space-y-2 text-sm">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette[index % palette.length] }} />
            <span className="text-text">{item.name}</span>
            <span className="text-muted">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPanel() {
  const [heatmap, setHeatmap] = useState(null);
  const [resourceDemand, setResourceDemand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [h, r] = await Promise.all([api.getHeatmapAnalytics(), api.getResourceDemandAnalytics()]);
      setHeatmap(h);
      setResourceDemand(r);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hourlyData = useMemo(() => {
    if (!heatmap?.hourlyAggregation) return [];
    return Object.keys(heatmap.hourlyAggregation)
      .sort((a, b) => Number(a) - Number(b))
      .map((hour) => ({ hour: `${hour}:00`, incidents: heatmap.hourlyAggregation[hour] }));
  }, [heatmap]);

  const demandPie = useMemo(() => {
    if (!resourceDemand?.totals) return [];
    return [
      { name: "Food", value: resourceDemand.totals.foodNeeded || 0 },
      { name: "Medical", value: resourceDemand.totals.medicalNeeded || 0 },
      { name: "Water", value: resourceDemand.totals.waterNeeded || 0 }
    ];
  }, [resourceDemand]);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-xl uppercase tracking-wide">Analytics</h3>
        <Button className="h-9 min-w-0 px-3 text-xs" variant="ghost" onClick={load}>Refresh</Button>
      </div>

      {loading && <p className="text-sm text-muted">Loading analytics...</p>}
      {error && <p className="rounded-lg border border-alert/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-white/5 p-3">
            <p className="mb-2 text-xs uppercase tracking-widest text-muted">Incident Heat Trend (Hourly)</p>
            <BarChartLite
              data={hourlyData.map((item) => ({
                label: item.hour,
                value: item.incidents,
                color: "linear-gradient(90deg, #79D4FF, #4DDA98)"
              }))}
            />
          </div>

          <div className="rounded-lg border border-border bg-white/5 p-3">
            <p className="mb-2 text-xs uppercase tracking-widest text-muted">Resource Demand Prediction</p>
            <DonutLite data={demandPie} />
          </div>
        </div>
      )}
    </Card>
  );
}
