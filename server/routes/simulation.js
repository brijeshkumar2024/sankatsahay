import express from "express";
import { simulationEngine } from "../services/simulationEngine.js";

const router = express.Router();

function hasSimulationAccess(req) {
  const expected = process.env.SIMULATION_KEY || "sankat-demo-key";
  const headerKey = req.headers["x-sim-key"];
  const queryKey = req.query.key;
  return headerKey === expected || queryKey === expected;
}

router.get("/state", (req, res) => {
  if (!hasSimulationAccess(req)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return res.json(simulationEngine.snapshot());
});

router.post("/command", (req, res) => {
  if (!hasSimulationAccess(req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

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
