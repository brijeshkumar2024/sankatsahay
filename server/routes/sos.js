import express from "express";
import SOSAlert from "../models/SOSAlert.js";
import { offlineQueueAware } from "../middleware/offlineQueue.js";

const router = express.Router();

router.post("/silent", offlineQueueAware, async (req, res) => {
  const { coordinates, mode = "tap", disasterType = "Flood", message = "Silent distress" } = req.body;

  const alert = await SOSAlert.create({
    userId: req.body?.userId || "demo-user",
    mode,
    message,
    disasterType,
    location: {
      type: "Point",
      coordinates
    }
  });

  req.app.get("io").to("admin-room").emit("sos:new", {
    id: alert._id,
    coordinates,
    mode,
    createdAt: alert.createdAt,
    offlineBuffered: req.isOfflineBuffered
  });

  return res.status(201).json({
    message: "Help is coming. Stay calm.",
    alert
  });
});

router.get("/active", async (_req, res) => {
  const alerts = await SOSAlert.find({ status: "active" }).sort({ createdAt: -1 }).limit(100);
  return res.json(alerts);
});

export default router;
