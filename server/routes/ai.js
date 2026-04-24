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
  try { parsed = JSON.parse(String(data)); } catch { parsed = { id }; }
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

// ── Voice chat — no auth, used by VoiceAI component ──────────────────────────
router.post("/voice-chat", async (req, res) => {
  const { messages = [], language = "hi-IN" } = req.body;
  const isHindi = language.startsWith("hi");

  // eslint-disable-next-line no-console
  console.log("[voice-chat] lang:", language,
    "| msgs:", messages.length,
    "| NVIDIA_BASE_URL:", process.env.NVIDIA_BASE_URL,
    "| model:", process.env.NVIDIA_MODEL,
    "| key exists:", !!process.env.NVIDIA_API_KEY);

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({
      baseURL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
      apiKey:  process.env.NVIDIA_API_KEY,
    });

    // Use provided messages or a safe default — never send empty array
    const payload = messages.length
      ? messages
      : [{ role: "user", content: "Hello, I need help" }];

    const completion = await client.chat.completions.create({
      model:       process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct",
      messages:    payload,
      max_tokens:  80,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content ||
      (isHindi ? "\u092e\u0926\u0926 \u0906 \u0930\u0939\u0940 \u0939\u0948\u0964 \u0936\u093e\u0902\u0924 \u0930\u0939\u0947\u0902\u0964" : "Help is coming. Stay calm.");

    // eslint-disable-next-line no-console
    console.log("[voice-chat] OK:", response.slice(0, 80));
    return res.json({ response });

  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[voice-chat] NVIDIA error:", err.message, "| status:", err.status);

    // Context-aware smart fallback — never show raw error to user
    const lastMsg = (messages.slice(-1)[0]?.content || "").toLowerCase();

    let fallback;
    if (lastMsg.includes("kahan") || lastMsg.includes("where") || lastMsg.includes("\u0915\u0939\u093e\u0902")) {
      fallback = isHindi
        ? "\u0906\u092a \u0938\u0939\u0940 \u0930\u093e\u0938\u094d\u0924\u0947 \u092a\u0930 \u0939\u0948\u0902\u0964 \u0938\u0940\u0927\u0947 \u0906\u0917\u0947 \u092c\u0922\u093c\u0947\u0902\u0964"
        : "You are on the right path. Keep going straight.";
    } else if (lastMsg.includes("dar") || lastMsg.includes("scared") || lastMsg.includes("\u0921\u0930") || lastMsg.includes("afraid")) {
      fallback = isHindi
        ? "\u0918\u092c\u0930\u093e\u0907\u090f \u0928\u0939\u0940\u0902\u0964 \u0906\u092a \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0939\u0948\u0902\u0964 \u092e\u0926\u0926 \u0906 \u0930\u0939\u0940 \u0939\u0948\u0964"
        : "Do not be afraid. You are safe. Help is coming.";
    } else if (lastMsg.includes("help") || lastMsg.includes("madad") || lastMsg.includes("\u092e\u0926\u0926")) {
      fallback = isHindi
        ? "\u0906\u092a\u0915\u0940 \u092e\u0926\u0926 \u0915\u0947 \u0932\u093f\u090f \u091f\u0940\u092e \u092d\u0947\u091c\u0940 \u091c\u093e \u0930\u0939\u0940 \u0939\u0948\u0964 \u0930\u0941\u0915\u093f\u090f\u0964"
        : "A team is being sent to help you. Please wait.";
    } else if (lastMsg.includes("pani") || lastMsg.includes("flood") || lastMsg.includes("\u092a\u093e\u0928\u0940")) {
      fallback = isHindi
        ? "\u0909\u0901\u091a\u0940 \u091c\u0917\u0939 \u091c\u093e\u0907\u090f\u0964 \u092a\u093e\u0928\u0940 \u0938\u0947 \u0926\u0942\u0930 \u0930\u0939\u0947\u0902\u0964"
        : "Move to higher ground. Stay away from water.";
    } else {
      const pool = isHindi
        ? ["\u092e\u0948\u0902 \u0938\u0941\u0928 \u0930\u0939\u093e \u0939\u0942\u0902\u0964 \u0906\u092a \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0939\u0948\u0902\u0964", "\u0918\u092c\u0930\u093e\u0907\u090f \u0928\u0939\u0940\u0902\u0964 \u092e\u0926\u0926 \u0930\u093e\u0938\u094d\u0924\u0947 \u092e\u0947\u0902 \u0939\u0948\u0964", "\u0906\u092a\u0915\u0940 \u092e\u0926\u0926 \u0915\u0947 \u0932\u093f\u090f \u091f\u0940\u092e \u0924\u0948\u092f\u093e\u0930 \u0939\u0948\u0964"]
        : ["I hear you. You are safe.", "Do not panic. Help is on the way.", "Our team is ready to help you."];
      fallback = pool[Math.floor(Math.random() * pool.length)];
    }

    return res.json({ response: fallback });
  }
});

export default router;
