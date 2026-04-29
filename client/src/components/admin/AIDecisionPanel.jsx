import { useEffect, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { api } from "../../services/api";

export default function AIDecisionPanel() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAIDecisions();
      setDecisions(data || []);
    } catch (err) {
      setError(err.message || "Failed to load AI decisions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const explain = async () => {
    const latest = decisions[0] || { decisionType: "resource_prediction", confidence: 70 };
    const data = await api.explainAdminDecision(latest.decisionType, latest);
    setExplanation(data.explanation || "No explanation available");
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-xl uppercase tracking-wide">AI Decision Explanation</h3>
        <Button className="h-9 min-w-0 px-3 text-xs" variant="ghost" onClick={load}>Refresh</Button>
      </div>

      {loading && <p className="text-sm text-muted">Loading AI decisions...</p>}
      {error && <p className="rounded-lg border border-alert/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="space-y-2">
        {decisions.map((d) => (
          <div key={d.id} className="rounded-lg border border-border bg-white/5 p-2">
            <p className="text-sm font-semibold text-text">{d.decisionType}</p>
            <p className="text-xs text-muted">Confidence: {d.confidence}% · {new Date(d.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <Button className="mt-3 h-9 min-w-0 px-3 text-xs" variant="ghost" onClick={explain}>Explain Latest Decision</Button>
      {explanation && <p className="mt-3 rounded-lg border border-border bg-white/5 p-3 text-sm text-muted">{explanation}</p>}
    </Card>
  );
}
