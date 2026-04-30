import express from "express";
import DisasterZone from "../models/DisasterZone.js";
import FoodParcel from "../models/FoodParcel.js";
import Shelter from "../models/Shelter.js";
import SensorPing from "../models/SensorPing.js";

const router = express.Router();

router.get("/zones", async (_req, res) => {
  const zones = await DisasterZone.find().sort({ updatedAt: -1 });
  res.json(zones);
});

router.get("/food-parcels", async (_req, res) => {
  const parcels = await FoodParcel.find().sort({ updatedAt: -1 }).limit(200);
  res.json(parcels);
});

router.get("/shelters", async (_req, res) => {
  const shelters = await Shelter.find().sort({ updatedAt: -1 }).limit(200);
  res.json(shelters);
});

// Hardcoded demo shelters — returned when DB is empty so the UI always works
const DEMO_SHELTERS = [
  { _id: "demo-shelter-1", name: "KIIT Campus Relief Centre",    capacity: 800, currentOccupancy: 312, medicalAvailable: true,  petFriendly: false, accessibility: true,  location: { type: "Point", coordinates: [85.7800, 20.3500] } },
  { _id: "demo-shelter-2", name: "Capital Hospital Shelter",     capacity: 400, currentOccupancy: 198, medicalAvailable: true,  petFriendly: false, accessibility: true,  location: { type: "Point", coordinates: [85.8400, 20.2700] } },
  { _id: "demo-shelter-3", name: "Bhubaneswar Railway Shelter",  capacity: 600, currentOccupancy: 421, medicalAvailable: false, petFriendly: true,  accessibility: true,  location: { type: "Point", coordinates: [85.8352, 20.2961] } },
  { _id: "demo-shelter-4", name: "Puri Beach Relief Camp",       capacity: 1200, currentOccupancy: 876, medicalAvailable: true, petFriendly: false, accessibility: false, location: { type: "Point", coordinates: [85.8312, 19.8135] } },
  { _id: "demo-shelter-5", name: "Cuttack Community Hall",       capacity: 350, currentOccupancy: 89,  medicalAvailable: false, petFriendly: true,  accessibility: true,  location: { type: "Point", coordinates: [85.8830, 20.4625] } },
];

router.get("/shelters/nearby", async (req, res) => {
  try {
    const { lat, lng, maxDistance = 50000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng required" });
    }

    const parsedLat = Number.parseFloat(String(lat));
    const parsedLng = Number.parseFloat(String(lng));

    let shelters = [];
    try {
      shelters = await Shelter.find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [parsedLng, parsedLat] },
            $maxDistance: Number.parseInt(String(maxDistance), 10)
          }
        }
      }).limit(10);
    } catch {
      // $near requires a 2dsphere index — if it fails (empty collection or missing index)
      // fall through to demo data below
    }

    // If DB returned nothing, use hardcoded demo shelters so UI never shows empty
    if (shelters.length === 0) {
      return res.json({ shelters: DEMO_SHELTERS, source: "demo" });
    }

    return res.json({ shelters });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/sensor-pings", async (_req, res) => {
  const pings = await SensorPing.find().sort({ createdAt: -1 }).limit(200);
  res.json(pings);
});

export default router;
