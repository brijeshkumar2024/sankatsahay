import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY
});

const defaultModel = process.env.NVIDIA_MODEL || "openai/gpt-oss-120b";

export async function askNvidia(messages, options = {}) {
  const completion = await client.chat.completions.create({
    model: defaultModel,
    messages,
    temperature: options.temperature ?? 0.4,
    top_p: options.topP ?? 1,
    max_tokens: options.maxTokens ?? 700
  });

  return completion.choices?.[0]?.message?.content || "";
}

function extractJson(text, fallback) {
  try {
    const cleaned = String(text || "").replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

export async function chatWithBot(message, language = "English", context = "") {
  const prompt = `You are SankatBot, an emergency assistant for India.
Be calm, brief (max 3 sentences), and respond in ${language}.
Only answer disaster-related queries.
If user seems panicked, calm them first before giving information.
Context: ${context}
Message: ${message}`;

  return askNvidia(
    [
      { role: "system", content: "You are a disaster-response assistant. Keep answers concise and safety-first." },
      { role: "user", content: prompt }
    ],
    { temperature: 0.3, maxTokens: 500 }
  );
}

export async function predictResources(zoneData) {
  const prompt = `You are a disaster resource planner. Given this zone data: ${JSON.stringify(zoneData)}
predict exact quantities needed: food_parcels, water_liters, medical_kits, shelter_capacity, volunteers_needed.
Output ONLY valid JSON, no explanation.`;

  const response = await askNvidia(
    [
      { role: "system", content: "Return strict JSON only." },
      { role: "user", content: prompt }
    ],
    { temperature: 0.2, maxTokens: 400 }
  );

  return extractJson(response, {
    food_parcels: 3200,
    water_liters: 15000,
    medical_kits: 700,
    shelter_capacity: 2200,
    volunteers_needed: 120
  });
}

export async function explainDecision(decisionType, decisionData) {
  const prompt = `Explain in simple Hindi or English (2-3 sentences) why this AI decision was made:
Type: ${decisionType}
Data: ${JSON.stringify(decisionData)}
Be specific about which data points drove the decision.`;

  return askNvidia(
    [
      { role: "system", content: "You explain disaster-response decisions clearly for non-technical users." },
      { role: "user", content: prompt }
    ],
    { temperature: 0.4, maxTokens: 300 }
  );
}

export async function analyzeTrafficRoute(zoneCoords, disasterType) {
  const prompt = `Emergency routing needed for ${disasterType} in this zone: ${JSON.stringify(zoneCoords)}.
Suggest 3 evacuation routes with priority order. Output JSON array.`;

  const response = await askNvidia(
    [
      { role: "system", content: "Return strict JSON array only for route planning." },
      { role: "user", content: prompt }
    ],
    { temperature: 0.3, maxTokens: 500 }
  );

  return extractJson(response, [
    { priority: 1, name: "East Corridor", etaMinutes: 14, points: zoneCoords },
    { priority: 2, name: "Riverside Alternate", etaMinutes: 18, points: zoneCoords },
    { priority: 3, name: "North Ring Road", etaMinutes: 21, points: zoneCoords }
  ]);
}

export async function streamVolunteerGuidance(taskData, res) {
  const prompt = `You are assisting a disaster response volunteer in real time.
Task Data: ${JSON.stringify(taskData)}
Give short actionable instructions with safety-first priority.`;

  const stream = await client.chat.completions.create({
    model: defaultModel,
    messages: [
      { role: "system", content: "Give short, actionable, safety-first guidance." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 700,
    stream: true
  });

  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content || "";
    if (text) {
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    }
  }

  res.write("data: [DONE]\n\n");
}
