import "reflect-metadata";
import { AppDataSource } from "../config/data-source.js";

async function revertLastMigration() {
  console.log("Connecting to Supabase PostgreSQL database...");
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection initialized.");

    console.log("Reverting last migration...");
    await AppDataSource.undoLastMigration();
    console.log("✅ Last migration was successfully reverted.");

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration rollback failed:", error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

revertLastMigration();

