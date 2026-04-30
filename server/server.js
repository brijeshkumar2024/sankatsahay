import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "node:http";
import cron from "node-cron";
import { Server } from "socket.io";
import connectDB from "./db.js";
import { basicRateLimit } from "./middleware/rateLimit.js";
import { registerSocketHandlers } from "./socket/socketHandlers.js";
import { runPredictionJob } from "./services/predictionService.js";
import { simulationEngine } from "./services/simulationEngine.js";
import { demoOrchestrator } from "./services/demoOrchestrator.js";

import authRoutes from "./routes/auth.js";
import sosRoutes from "./routes/sos.js";
import familyRoutes from "./routes/family.js";
import volunteerRoutes from "./routes/volunteer.js";
import taskRoutes from "./routes/tasks.js";
import resourcesRoutes from "./routes/resources.js";
import aiRoutes from "./routes/ai.js";
import adminRoutes from "./routes/admin.js";
import sensorsRoutes from "./routes/sensors.js";
import simulationRoutes from "./routes/simulation.js";

import User from "./models/User.js";
import bcrypt from "bcryptjs";

const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://sankatsahay-client.vercel.app",
];

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser tools (no origin) like Postman/curl
    if (!origin) return callback(null, true);

    // Exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all Vercel preview domains
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-sim-key"]
};

const io = new Server(httpServer, {
  cors: corsOptions
});

// Connect DB before registering routes.
await connectDB();

// ── Seed default admin user if not exists ───────────────────────────────────
try {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sankatsahay.in";
  const adminPassword = process.env.ADMIN_PASSWORD || "NEXORA2025";
  const exists = await User.findOne({ email: adminEmail.toLowerCase() });
  if (!exists) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await User.create({
      name: "System Administrator",
      email: adminEmail.toLowerCase(),
      password: hash,
      role: "admin",
      preferredLanguage: "en",
      status: "SAFE"
    });
    // eslint-disable-next-line no-console
    console.log("[seed] Admin user created:", adminEmail);
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error("[seed] Admin seed failed:", err.message);
}

app.set("io", io);
app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(basicRateLimit());

app.get("/health", (_req, res) => res.json({ ok: true, service: "sankatsahay-server" }));
app.get("/api/debug/cors", (req, res) => {
  res.json({
    ok: true,
    origin: req.headers.origin,
    message: "CORS working",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/resources", resourcesRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sensors", sensorsRoutes);
app.use("/api/simulation", simulationRoutes);

registerSocketHandlers(io);
simulationEngine.attach(io);
demoOrchestrator.attach(io);
simulationEngine.start();

cron.schedule("0 * * * *", async () => {
  const zone = await runPredictionJob();
  if (zone) {
    io.to("admin-room").emit("prediction:update", zone);
  }
});

const port = Number(process.env.PORT || 5000);

httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(`Port ${port} is already in use. Kill the old process and restart.`);
    // Exit cleanly so nodemon doesn't crash-loop
    process.exit(1);
  } else {
    throw err;
  }
});

httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${port}`);
});
