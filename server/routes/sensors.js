import express from "express";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/ble-ping", requireAuth, async (req, res) => {
  const payload = {
    userId: req.user.id,
    count: req.body.count,
    distanceMeters: req.body.distanceMeters,
    coordinates: req.body.coordinates,
    createdAt: new Date().toISOString()
  };

  req.app.get("io").to("admin-room").emit("sensor:ble", payload);
  res.status(202).json({ ok: true });
});

router.post("/motion-signal", requireAuth, async (req, res) => {
  req.app.get("io").to("admin-room").emit("sensor:motion", req.body);
  res.status(202).json({ ok: true });
});

export default router;
