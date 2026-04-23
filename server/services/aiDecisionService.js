import AIDecision from "../models/AIDecision.js";

function clampConfidence(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function logAIDecision({ decisionType, confidence, explanation, payload }) {
  return AIDecision.create({
    decisionType: decisionType || "other",
    confidence: clampConfidence(confidence),
    explanation: String(explanation || "").slice(0, 220),
    payload: payload || {}
  });
}

export async function getRecentAIDecisions(limit = 5) {
  const size = Math.max(1, Math.min(20, Number(limit) || 5));
  return AIDecision.find().sort({ createdAt: -1 }).limit(size);
}
