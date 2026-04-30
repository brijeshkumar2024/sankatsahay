import express from "express";
import Volunteer from "../models/Volunteer.js";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { explainDecision } from "../services/nvidiaService.js";
import { logAIDecision } from "../services/aiDecisionService.js";

const router = express.Router();

function toRadians(v) {
  return (v * Math.PI) / 180;
}

function haversineDistanceKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.post("/assign", async (req, res) => {
  const { requiredSkills = [], taskLocation, maxRadiusKm = 10, taskId, rewardCredits = 30 } = req.body;
  if (!taskLocation || !Array.isArray(taskLocation) || taskLocation.length !== 2) {
    return res.status(400).json({ message: "taskLocation [lng,lat] is required" });
  }

  const volunteers = await Volunteer.find({ availability: true }).limit(100);

  const ranked = volunteers
    .map((v) => {
      const skillMatches = requiredSkills.filter((s) => v.skills.includes(s)).length;
      const skillMatch = requiredSkills.length ? skillMatches / requiredSkills.length : 1;
      const distanceKm = haversineDistanceKm(v.location.coordinates, taskLocation);
      const proximityScore = Math.max(0, 1 - distanceKm / maxRadiusKm);
      const trust = Math.max(0, Math.min(1, (v.trustScore || 0) / 100));
      const score = skillMatch * 0.4 + proximityScore * 0.35 + trust * 0.25;
      return {
        volunteer: v,
        total: Number(score.toFixed(4)),
        distanceKm
      };
    })
    .sort((a, b) => b.total - a.total);

  const top = ranked[0];
  if (!top) return res.status(404).json({ message: "No volunteer available" });

  top.volunteer.availability = false;
  top.volunteer.status = "assigned";
  await top.volunteer.save();

  const task = {
    taskId: taskId || `TASK-${Date.now()}`,
    requiredSkills,
    taskLocation,
    rewardCredits,
    assignedAt: new Date().toISOString()
  };

  req.app.get("io").to("admin-room").emit("volunteer:assigned", {
    volunteerId: top.volunteer._id,
    score: top.total,
    task
  });
  req.app.get("io").to(`user:${top.volunteer.userId}`).emit("volunteer:assigned", { ...task, score: top.total });

  const guidance = await explainDecision("volunteer_assignment", {
    volunteerId: top.volunteer._id,
    score: top.total,
    distanceKm: top.distanceKm,
    requiredSkills
  });

  await logAIDecision({
    decisionType: "volunteer_assignment",
    confidence: top.total * 100,
    explanation: String(guidance).split("\n")[0] || "Volunteer assigned by skill-proximity-trust model",
    payload: {
      volunteerId: top.volunteer._id,
      taskId: task.taskId,
      score: top.total,
      distanceKm: top.distanceKm,
      requiredSkills
    }
  });

  return res.json({
    volunteer: top.volunteer,
    score: top.total,
    distanceKm: top.distanceKm,
    task,
    guidance
  });
});

router.post("/complete", async (req, res) => {
  const { volunteerId, taskLocation, submissionLocation, victimConfirmed, rewardCredits = 30 } = req.body;
  const volunteer = await Volunteer.findById(volunteerId);
  if (!volunteer) return res.status(404).json({ message: "Volunteer not found" });

  const distanceMeters = haversineDistanceKm(taskLocation, submissionLocation) * 1000;
  const gpsVerified = distanceMeters <= 50;

  if (gpsVerified && victimConfirmed) {
    volunteer.trustScore = Math.min(100, volunteer.trustScore + 10);
    volunteer.credits += rewardCredits;
    volunteer.availability = true;
    volunteer.status = "available";
    await volunteer.save();

    const certDir = path.resolve("server", "uploads", "certificates");
    fs.mkdirSync(certDir, { recursive: true });
    const certPath = path.join(certDir, `${volunteer._id}-${Date.now()}.pdf`);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(certPath);
    doc.pipe(stream);
    doc.fontSize(20).text("SankatSahay Volunteer Certificate", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Volunteer ID: ${volunteer._id}`);
    doc.text(`Reward Credits: ${rewardCredits}`);
    doc.text(`Issued: ${new Date().toISOString()}`);
    const qrData = await QRCode.toDataURL(`verify:${volunteer._id}:${Date.now()}`);
    doc.image(Buffer.from(qrData.split(",")[1], "base64"), { fit: [130, 130] });
    doc.end();

    return res.json({
      rewarded: true,
      gpsVerified,
      trustScore: volunteer.trustScore,
      credits: volunteer.credits,
      certificate: certPath
    });
  }

  return res.status(400).json({
    rewarded: false,
    gpsVerified,
    message: "Fraud check failed or victim confirmation missing"
  });
});

export default router;
