import express from "express";

const router = express.Router();

router.post("/ble-ping", async (req, res) => {
  const payload = {
    userId: req.body?.userId || "demo-user",
    count: req.body.count,
    distanceMeters: req.body.distanceMeters,
    coordinates: req.body.coordinates,
    createdAt: new Date().toISOString()
  };

  req.app.get("io").to("admin-room").emit("sensor:ble", payload);
  res.status(202).json({ ok: true });
});

router.post("/motion-signal", async (req, res) => {
  req.app.get("io").to("admin-room").emit("sensor:motion", req.body);
  res.status(202).json({ ok: true });
});

export default router;
