import { useEffect, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { api } from "../../services/api";
import useDemoStore from "../../../store/useDemoStore.js";

const FALLBACK_DECISIONS = [
  {
    id: "demo-ai-1",
    decisionType: "resource_prediction",
    confidence: 92,
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    explanation: "AI predicts 245 food parcels needed in Puri zone based on SOS density + flood level."
  },
  {
    id: "demo-ai-2",
    decisionType: "panic_protocol",
    confidence: 87,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    explanation: "High panic index (84%) detected — voice calm-down activated for 47 users."
  },
  {
    id: "demo-ai-3",
    decisionType: "volunteer_route",
    confidence: 95,
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    explanation: "Optimal routes computed avoiding flooded areas, ETA 8min for volunteer team."
  }
];

const STEP_EXPLANATIONS = {
  cyclone: "Cyclone Yaas Category 4 detected. AI predicts coastal flooding in Puri-Bhubaneswar corridor.",
  sos: "SOS cluster analysis: 12 signals from 3km radius. Critical priority assigned.",
  panic: "Panic reversal protocol: Emotion AI detected fear in 68% of signals — calm voice deployed.",
  family: "Face match success rate 94%. 3 family members located within 2.1km radius.",
  volunteer: "Volunteer optimization: 12 nearest responders assigned with dynamic rerouting."
};

export default function AIDecisionPanel() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");
  const demoPhase = useDemoStore((s) => s.activePhase || 'sos');

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAIDecisions();
const safeData = Array.isArray(data) && data.length > 0 ? data : FALLBACK_DECISIONS;
      setDecisions(safeData);
    } catch (err) {
      console.warn("AI decisions API failed, using demo fallback:", err);
      setDecisions(FALLBACK_DECISIONS);
    } finally {
      setLoading(false);
    }0+
  };

  useEffect(() => {
    load();
  }, []);

  const explain = async () => {
    try {
      const latest = decisions[0] || FALLBACK_DECISIONS[0];
    const data = await api.explainAdminDecision(latest.decisionType, latest);
      setExplanation(data.explanation || STEP_EXPLANATIONS[demoPhase] || "AI analysis complete — optimal response deployed.");
    } catch (err) {
      setExplanation(
        STEP_EXPLANATIONS[demoPhase] ||
          "AI transparency: Decision based on real-time SOS clustering, weather data, and volunteer proximity."
      );
    }
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-xl uppercase tracking-wide">
          AI Decision Explanation
        </h3>
        <Button
          className="h-9 min-w-0 px-3 text-xs"
          variant="ghost"
          onClick={load}
          <p className="text-sm text-muted">No decisions — simulation ready.</p>
        )}
      </div>

      <Button className="mt-3 h-9 min-w-0 px-3 text-xs" variant="ghost" onClick={explain}>Explain Latest Decision</Button>
      {explanation && (
        <div className="mt-3 rounded-lg border border-border/50 bg-gradient-to-r from-safe/10 to-safe/5 p-3">
          <p className="text-sm text-text">{explanation}</p>
        </div>
      )}
    </Card>
  );
}
        >
          Refresh
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-muted">Loading AI decisions...</p>
      )}

      {error && (
        <p className="rounded-lg border border-alert/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="space-y-2">
        {decisions.slice(0, 3).map((d) => (
          <div
            key={d.id}
            className="rounded-lg border border-border/40 bg-black/30 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase text-primary">
                {d.decisionType.replace("_", " ")}
              </span>
              <span className="text-xs text-green-400">
                {d.confidence}% confidence
              </span>
            </div>

            <p className="mt-1 text-xs text-muted">
              {new Date(d.timestamp).toLocaleTimeString()}
            </p>

            <p className="mt-2 text-sm text-gray-200">
              {d.explanation}
            </p>
          </div>
        ))}
      </div>

      {/* Explain Button */}
      <div className="mt-4">
        <Button onClick={explain} className="w-full">
          Explain Latest Decision
        </Button>
      </div>

      {/* Explanation Output */}
      {explanation && (
        <div className="mt-4 rounded-lg border border-primary/40 bg-blue-950/30 p-3">
          <p className="text-sm text-blue-200">{explanation}</p>
        </div>
      )}
    </Card>
  );
}