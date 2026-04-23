import SOSAlert from "../models/SOSAlert.js";
import SensorPing from "../models/SensorPing.js";
import User from "../models/User.js";
import { sendSMS } from "../services/smsService.js";
import { explainDecision } from "../services/nvidiaService.js";
import { logAIDecision } from "../services/aiDecisionService.js";
import { simulationEngine } from "../services/simulationEngine.js";
import { demoOrchestrator } from "../services/demoOrchestrator.js";

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("join:admin", () => socket.join("admin-room"));
    socket.on("join:ops", () => socket.join("ops-room"));
    socket.on("join:simulation", () => socket.join("sim-room"));
    socket.on("join:demo", () => socket.join("demo-room"));
    socket.on("join:family", (familyPin) => socket.join(`family:${familyPin}`));
    socket.on("join:zone", (zoneId) => socket.join(`zone:${zoneId}`));
    socket.on("join:user", (userId) => socket.join(`user:${userId}`));

    socket.on("simulate:request-state", () => {
      socket.emit("state:scenario:update", simulationEngine.snapshot());
    });

    socket.on("simulate:cyclone", (payload = {}) => {
      simulationEngine.applyCyclone(payload);
    });

    socket.on("simulate:flood", (payload = {}) => {
      simulationEngine.applyFlood(payload);
    });

    socket.on("simulate:panic", (payload = {}) => {
      simulationEngine.applyPanic(payload);
    });

    socket.on("simulate:reset", () => {
      simulationEngine.applyReset();
    });

    socket.on("simulate:config:update", (payload = {}) => {
      simulationEngine.updateConfig(payload);
    });

    socket.on("simulate:story:play", () => {
      simulationEngine.playStory();
    });

    socket.on("demo:request-state", () => {
      socket.emit("demo:step-changed", demoOrchestrator.getState());
    });

    socket.on("demo:run-step", async ({ step }) => {
      await demoOrchestrator.runStep(step);
    });

    socket.on("demo:user-action", async ({ action }) => {
      await demoOrchestrator.runUserAction(action);
    });

    socket.on("sos:trigger", (payload) => {
      io.to("admin-room").emit("sos:new", payload);
    });

    socket.on("sos:silent", async (payload) => {
      try {
        const { lat, lng, userId, timestamp } = payload;

        // Guard: only pass userId if it looks like a valid MongoDB ObjectId.
        // The demo client sends "demo-user" which is not a valid ObjectId
        // and causes a Mongoose cast error that crashes the server.
        const mongoose = (await import("mongoose")).default;
        const safeUserId = mongoose.isValidObjectId(userId) ? userId : undefined;

        const alert = await SOSAlert.create({
          userId: safeUserId,
          mode: "tap",
          status: "active",
          message: "Silent SOS from tap trigger",
          location: {
            type: "Point",
            coordinates: [Number(lng) || 85.8245, Number(lat) || 20.2961]
          },
          createdAt: timestamp ? new Date(timestamp) : undefined
        });

        io.to("admin-room").emit("sos:new", {
          id: alert._id,
          userId: safeUserId,
          lat,
          lng,
          status: alert.status,
          mode: alert.mode,
          createdAt: alert.createdAt
        });

        const user = safeUserId ? await User.findById(safeUserId).catch(() => null) : null;
        const contacts = user?.emergencyContacts || [];
        for (const c of contacts) {
          if (c.phone) {
            await sendSMS(c.phone, `SANKATSAHAY: Silent SOS from ${user.name || "user"} at ${new Date().toLocaleTimeString()}.`);
          }
        }
        if (process.env.ADMIN_PHONE_NUMBER) {
          await sendSMS(process.env.ADMIN_PHONE_NUMBER, `SANKATSAHAY ADMIN ALERT: Silent SOS detected near ${lat}, ${lng}`);
        }
      } catch (err) {
        // Never crash the server on a bad SOS payload
        // eslint-disable-next-line no-console
        console.error("sos:silent error:", err.message);
      }
    });

    socket.on("sos:auto-alert", async (data) => {
      try {
        const mongoose = (await import("mongoose")).default;
        const safeUserId = mongoose.isValidObjectId(data.userId) ? data.userId : undefined;
        const alert = await SOSAlert.create({
          userId: safeUserId,
          mode: "auto",
          status: "active",
          message: data.reason,
          location: { type: "Point", coordinates: [Number(data.lng) || 85.8245, Number(data.lat) || 20.2961] },
          createdAt: data.timestamp ? new Date(data.timestamp) : undefined
        });
        io.to("admin-room").emit("sos:new", {
          ...alert.toObject(),
          alertType: "AUTO-ALERT: Unresponsive User"
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Auto-alert error:", err.message);
      }
    });

    socket.on("family:status:update", ({ familyPin, member }) => {
      io.to(`family:${familyPin}`).emit("family:status-update", member);
      io.to("admin-room").emit("family:status", { familyPin, member });
    });

    socket.on("volunteer:position", (payload) => {
      io.to("admin-room").emit("volunteer:position", payload);
    });

    socket.on("emotion:update", async ({ userId, state, confidence }) => {
      let shouldLog = false;
      let previousState = null;
      if (userId) {
        const existing = await User.findById(userId).select("emotionState");
        previousState = existing?.emotionState?.state;
        shouldLog = previousState !== state;
        await User.findByIdAndUpdate(userId, {
          emotionState: { state, confidence }
        });
      }

      if (shouldLog) {
        const line = await explainDecision("emotion_detection", {
          previousState,
          currentState: state,
          confidence
        }).catch(() => "Emotion changed based on detector confidence thresholds.");
        await logAIDecision({
          decisionType: "emotion_detection",
          confidence: Number(confidence || 0) * 100,
          explanation: String(line).split("\n")[0],
          payload: { userId, previousState, state, confidence }
        });
      }

      io.to("admin-room").emit("emotion:update", { userId, state, confidence });
    });

    socket.on("bluetooth:ping", async (payload) => {
      try {
        const { lat, lng, userId, deviceCount } = payload;
        const mongoose = (await import("mongoose")).default;
        const safeUserId = mongoose.isValidObjectId(userId) ? userId : undefined;
        await SensorPing.create({
          type: "bluetooth",
          userId: safeUserId,
          location: { type: "Point", coordinates: [Number(lng) || 85.8245, Number(lat) || 20.2961] },
          payload
        });
        io.to("admin-room").emit("bluetooth:ping", {
          ...payload,
          label: `${deviceCount} devices detected - possible survivors 45m away`
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("bluetooth:ping error:", err.message);
      }
    });

    socket.on("sensor:distress", async (payload) => {
      try {
        const { lat, lng, userId } = payload;
        const mongoose = (await import("mongoose")).default;
        const safeUserId = mongoose.isValidObjectId(userId) ? userId : undefined;
        await SensorPing.create({
          type: "distress",
          userId: safeUserId,
          location: { type: "Point", coordinates: [Number(lng) || 85.8245, Number(lat) || 20.2961] },
          payload
        });
        io.to("admin-room").emit("sensor:distress", payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("sensor:distress error:", err.message);
      }
    });

    socket.on("disconnect", () => {
      // Explicit no-op keeps lifecycle hooks available for future audit logs.
    });
  });
}
