import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import cron from "node-cron";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import { basicRateLimit } from "./middleware/rateLimit.js";
import { registerSocketHandlers } from "./socket/socketHandlers.js";
import { runPredictionJob } from "./services/predictionService.js";
import { simulationEngine } from "./services/simulationEngine.js";
import { demoOrchestrator } from "./services/demoOrchestrator.js";

import authRoutes from "./routes/auth.js";
import sosRoutes from "./routes/sos.js";
import familyRoutes from "./routes/family.js";
import volunteerRoutes from "./routes/volunteer.js";
import resourcesRoutes from "./routes/resources.js";
import aiRoutes from "./routes/ai.js";
import adminRoutes from "./routes/admin.js";
import sensorsRoutes from "./routes/sensors.js";
import simulationRoutes from "./routes/simulation.js";

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  process.env.SIM_CONTROL_URL || "http://localhost:5173"
];
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH"]
  }
});

app.set("io", io);
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "2mb" }));
app.use(basicRateLimit());

app.get("/health", (_req, res) => res.json({ ok: true, service: "sankatsahay-server" }));

app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/volunteer", volunteerRoutes);
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

async function bootstrap() {
  await connectDB(process.env.MONGODB_URI);
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", err);
  process.exit(1);
});
