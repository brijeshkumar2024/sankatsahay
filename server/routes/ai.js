import express from "express";
import {
  analyzeTrafficRoute,
  chatWithBot,
  explainDecision,
  predictResources,
  streamVolunteerGuidance
} from "../services/geminiService.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/chat", requireAuth, async (req, res) => {
  const { message, language = "English", context = "" } = req.body;
  const reply = await chatWithBot(message, language, context);

  res.json({ reply });
});

router.post("/predict-resources", requireAuth, async (req, res) => {
  const prediction = await predictResources(req.body.zoneData || {});
  res.json({ prediction });
});

router.get("/explain", requireAuth, async (req, res) => {
  const { type = "general", id = "", data = "{}" } = req.query;
  let parsed = {};
  try {
    parsed = JSON.parse(String(data));
  } catch {
    parsed = { id };
  }
  const explanation = await explainDecision(type, parsed);
  res.json({ explanation });
});

router.post("/explain", requireAuth, async (req, res) => {
  const { decisionType = "general", decisionData = {} } = req.body;
  const explanation = await explainDecision(decisionType, decisionData);
  res.json({ explanation });
});

router.post("/traffic-route", requireAuth, async (req, res) => {
  const { zoneCoords = [], disasterType = "Flood" } = req.body;
  const routes = await analyzeTrafficRoute(zoneCoords, disasterType);
  res.json({ routes });
});

router.post("/volunteer-guidance/stream", requireAuth, async (req, res) => {
  await streamVolunteerGuidance(req.body.taskData || {}, res);
});

// Voice chat — no auth required so VoiceAI works without login
router.post("/voice-chat", async (req, res) => {
  try {
    const { messages = [], language = "hi-IN" } = req.body;
    if (!messages.length) return res.status(400).json({ error: "messages required" });

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({
      baseURL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
      apiKey:  process.env.NVIDIA_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model:       process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct",
      messages,
      max_tokens:  120,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content ||
      (language.startsWith("hi") ? "मदद आ रही है। शांत रहें।" : "Help is coming. Stay calm.");

    return res.json({ response });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("voice-chat error:", err.message);
    return res.status(500).json({
      response: "Abhi connect nahi ho pa raha. SOS button dabayein.",
      error: err.message,
    });
  }
});

export default router;
