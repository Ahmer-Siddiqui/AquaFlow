import "reflect-metadata";
import { AppDataSource } from "./config/data-source.js";

async function checkDatabaseConnection() {
  console.log("Connecting to Supabase PostgreSQL database via TypeORM...");
  try {
    await AppDataSource.initialize();
    console.log("✅ TypeORM AppDataSource successfully initialized!");

    const result = await AppDataSource.query("SELECT NOW() as current_time, version() as pg_version;");
    console.log("✅ Supabase query test successful:");
    console.log("Current Server Time:", result[0]?.current_time);
    console.log("PostgreSQL Version:", result[0]?.pg_version);

    await AppDataSource.destroy();
    console.log("Database connection closed cleanly.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to connect to Supabase database:", error);
    process.exit(1);
  }
}

checkDatabaseConnection();

