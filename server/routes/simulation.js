import express from "express";
import { simulationEngine } from "../services/simulationEngine.js";

const router = express.Router();

router.get("/state", (req, res) => {
  return res.json(simulationEngine.snapshot());
});

router.post("/command", (req, res) => {
  const { command, payload } = req.body || {};
  if (!command) {
    return res.status(400).json({ message: "Command is required" });
  }

  if (command === "simulate:cyclone") simulationEngine.applyCyclone(payload);
  else if (command === "simulate:flood") simulationEngine.applyFlood(payload);
  else if (command === "simulate:panic") simulationEngine.applyPanic(payload);
  else if (command === "simulate:reset") simulationEngine.applyReset();
  else if (command === "simulate:config:update") simulationEngine.updateConfig(payload);
  else if (command === "simulate:story:play") simulationEngine.playStory();
  else return res.status(400).json({ message: "Unknown simulation command" });

  return res.json({ ok: true, command, state: simulationEngine.snapshot() });
});

export default router;
