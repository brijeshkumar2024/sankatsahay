import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.NVIDIA_BASE_URL,
  apiKey: process.env.NVIDIA_API_KEY
});
const MODEL = process.env.NVIDIA_MODEL || "openai/gpt-oss-120b";

export async function chatWithBot(message, language = "English", _context = "") {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are SankatBot, an emergency assistant for India.
Be calm, brief (max 3 sentences), respond in ${language}.
Only answer disaster-related queries.
If user seems panicked, calm them first.`
      },
      { role: "user", content: message }
    ],
    max_tokens: 200,
    temperature: 0.5
  });
  return completion.choices[0].message.content;
}

export async function predictResources(zoneData) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are a disaster resource planner. Output ONLY valid JSON, no explanation, no markdown."
      },
      {
        role: "user",
        content: `Given this disaster zone data: ${JSON.stringify(zoneData)}
Predict exact quantities needed. Output this exact JSON shape:
{
  "food_parcels": number,
  "water_liters": number,
  "medical_kits": number,
  "shelter_capacity": number,
  "volunteers_needed": number,
  "priority": "HIGH|MEDIUM|LOW",
  "reasoning": "one sentence"
}`
      }
    ],
    max_tokens: 300,
    temperature: 0.3
  });
  const text = completion.choices[0].message.content;
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function explainDecision(decisionType, decisionData) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You explain AI decisions in simple Hindi or English, 2-3 sentences max."
      },
      {
        role: "user",
        content: `Explain why this AI decision was made:
Type: ${decisionType}
Data: ${JSON.stringify(decisionData)}
Be specific about which data points drove the decision.`
      }
    ],
    max_tokens: 150,
    temperature: 0.4
  });
  return completion.choices[0].message.content;
}

export async function analyzeTrafficRoute(zoneCoords, disasterType) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are an emergency routing expert. Output ONLY a valid JSON array, no explanation."
      },
      {
        role: "user",
        content: `Emergency routing for ${disasterType} disaster.
Zone coordinates: ${JSON.stringify(zoneCoords)}
Suggest 3 evacuation routes with priority order.
Output JSON array:
[
  { "priority": 1, "route": "description", "estimatedTime": "X mins", "reason": "why" },
  { "priority": 2, "route": "description", "estimatedTime": "X mins", "reason": "why" },
  { "priority": 3, "route": "description", "estimatedTime": "X mins", "reason": "why" }
]`
      }
    ],
    max_tokens: 400,
    temperature: 0.3
  });
  const text = completion.choices[0].message.content;
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function streamVolunteerGuidance(taskData, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are a real-time disaster rescue coordinator. Give brief, calm, numbered steps."
      },
      {
        role: "user",
        content: `Give real-time guidance for this rescue task: ${JSON.stringify(taskData)}
Provide 5 short numbered steps. Each step max 15 words.`
      }
    ],
    max_tokens: 300,
    temperature: 0.4,
    stream: true
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
  }
  res.write("data: [DONE]\n\n");
  res.end();
}
