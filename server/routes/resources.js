import express from "express";
import DisasterZone from "../models/DisasterZone.js";
import FoodParcel from "../models/FoodParcel.js";
import Shelter from "../models/Shelter.js";
import SensorPing from "../models/SensorPing.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/zones", requireAuth, async (_req, res) => {
  const zones = await DisasterZone.find().sort({ updatedAt: -1 });
  res.json(zones);
});

router.get("/food-parcels", requireAuth, async (_req, res) => {
  const parcels = await FoodParcel.find().sort({ updatedAt: -1 }).limit(200);
  res.json(parcels);
});

router.get("/shelters", requireAuth, async (_req, res) => {
  const shelters = await Shelter.find().sort({ updatedAt: -1 }).limit(200);
  res.json(shelters);
});

router.get("/shelters/nearby", async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng required" });
    }
    const shelters = await Shelter.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(String(lng)), Number.parseFloat(String(lat))]
          },
          $maxDistance: Number.parseInt(String(maxDistance), 10)
        }
      }
    }).limit(10);
    return res.json({ shelters });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/sensor-pings", requireAuth, async (_req, res) => {
  const pings = await SensorPing.find().sort({ createdAt: -1 }).limit(200);
  res.json(pings);
});

export default router;
