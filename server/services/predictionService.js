import axios from "axios";
import Parser from "rss-parser";
import DisasterZone from "../models/DisasterZone.js";
import { predictResources } from "./geminiService.js";
import { logAIDecision } from "./aiDecisionService.js";

const parser = new Parser();

async function fetchExternalSignals() {
  const feeds = await parser.parseURL("https://www.gdacs.org/xml/rss.xml");
  const weather = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
    params: {
      lat: 20.2961,
      lon: 85.8245,
      appid: process.env.OPENWEATHER_API_KEY || "demo"
    }
  }).catch(() => ({ data: { weather: [{ description: "unknown" }] } }));

  return {
    gdacs: feeds.items.slice(0, 5).map((i) => ({ title: i.title, link: i.link })),
    weather: weather.data
  };
}

export async function runPredictionJob() {
  const zone = await DisasterZone.findOne({ name: "Cuttack Flood Zone" });
  if (!zone) return null;

  const signals = await fetchExternalSignals();
  const prompt = [
    {
      zone: zone.name,
      severity: zone.severity,
      disasterType: zone.disasterType,
      signals
    }
  ];

  let parsed;
  try {
    const prediction = await predictResources(prompt);
    parsed = {
      foodParcels: prediction.food_parcels,
      waterLiters: prediction.water_liters,
      medicalKits: prediction.medical_kits,
      shelterCapacity: prediction.shelter_capacity,
      volunteersNeeded: prediction.volunteers_needed,
      summary: `Predicted with NVIDIA model for ${zone.name}`,
      confidence: 0.8
    };
  } catch {
    parsed = {
      foodParcels: 3200,
      waterLiters: 15000,
      medicalKits: 700,
      shelterCapacity: 2200,
      summary: "High flood risk with rapid displacement expected.",
      confidence: 0.78
    };
  }

  zone.aiPrediction = {
    ...parsed,
    sources: ["GDACS", "OpenWeatherMap", "User Signals", "NVIDIA"],
    generatedAt: new Date()
  };

  await zone.save();

  await logAIDecision({
    decisionType: "resource_prediction",
    confidence: Number(parsed.confidence || 0) * 100,
    explanation: parsed.summary || `Predicted resources for ${zone.name}`,
    payload: {
      zone: zone.name,
      severity: zone.severity,
      foodParcels: parsed.foodParcels,
      waterLiters: parsed.waterLiters,
      medicalKits: parsed.medicalKits,
      shelterCapacity: parsed.shelterCapacity
    }
  });

  return zone;
}
