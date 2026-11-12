import "reflect-metadata";
import { AppDataSource } from "../config/data-source.js";

async function runMigrations() {
  console.log("Connecting to Supabase PostgreSQL database...");
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection initialized.");

    console.log("Running pending migrations...");
    const executedMigrations = await AppDataSource.runMigrations();

    if (executedMigrations.length === 0) {
      console.log("✨ No pending migrations. Database schema is completely up to date!");
    } else {
      console.log(
        `\n🎉 Successfully executed ${executedMigrations.length} migration(s):`
      );
      for (const m of executedMigrations) {
        console.log(`  + [EXECUTED] ${m.name}`);
      }
    }

    await AppDataSource.destroy();
    console.log("\n✅ Migration process completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

runMigrations();

