import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { AppDataSource } from "./config/data-source.js";

const server = http.createServer(app);

async function startServer() {
  try {
    console.log("🌊 Starting AquaFlow SaaS Backend Server...");

    // 1. Initialize TypeORM Connection to Supabase PostgreSQL
    console.log("⏳ Connecting to Supabase PostgreSQL via TypeORM...");
    await AppDataSource.initialize();
    console.log("✅ Supabase PostgreSQL Database connected successfully!");

    // 2. Start HTTP Server
    server.listen(env.PORT, () => {
      console.log(`🚀 AquaFlow Server running on port ${env.PORT} in [${env.NODE_ENV}] mode`);
      console.log(`🩺 Health check available at: http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error("❌ Fatal: Failed to initialize AquaFlow server:", error);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// GRACEFUL SHUTDOWN HANDLERS
// -----------------------------------------------------------------------------

async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("🔌 Closed active HTTP connections.");

    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log("🗄️ Supabase TypeORM database connection closed cleanly.");
      }
      console.log("👋 AquaFlow Server exited cleanly. Goodbye!");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error during database teardown:", err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds if hanging
  setTimeout(() => {
    console.error("⚠️ Forcing shutdown after timeout!");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (reason: any) => {
  console.error("💥 Unhandled Rejection at:", reason);
});

process.on("uncaughtException", (error: Error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

startServer();

