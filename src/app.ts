import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import serviceRoutes from "./routes/service.routes";
import activationRoutes from "./routes/activation.routes";
import onboardingRoutes from "./routes/onboarding.routes";
import billingRoutes from "./routes/billing.routes";
import adminRoutes from "./routes/admin.routes";
import { errorHandler } from "./middleware/error";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/auth/activation", activationRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/onboarding", onboardingRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/billing", billingRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("Solar Swim Gym Backend is running");
});

// Error Handler (must be last)
app.use(errorHandler);

// Start Server
const server = app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}`);
  console.log(`📍 API Base: http://localhost:${port}/api/v1`);
});

// Keep-alive heartbeat (optional - comment out in production)
setInterval(() => {
  console.log(`💓 Server heartbeat - ${new Date().toLocaleTimeString()}`);
}, 30000); // Log every 30 seconds

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

export default app;
