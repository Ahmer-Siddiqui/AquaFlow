import "reflect-metadata";
import { AppDataSource } from "../config/data-source.js";

async function revertAllMigrations() {
  console.log("Connecting to Supabase PostgreSQL database...");
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection initialized.");

    console.log("Checking executed migrations...");
    const tableExists = await AppDataSource.query(`
      SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations';
    `);

    if (tableExists.length > 0) {
      const executed = await AppDataSource.query(
        `SELECT * FROM "migrations" ORDER BY "id" DESC;`
      );
      console.log(`Found ${executed.length} executed migration(s). Reverting all...`);

      for (const m of executed) {
        console.log(`Reverting migration: ${m.name}...`);
        await AppDataSource.undoLastMigration();
        console.log(`  ✓ Reverted: ${m.name}`);
      }
    } else {
      console.log("No migrations table found.");
    }

    await AppDataSource.destroy();
    console.log("🎉 All migrations successfully reverted!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration rollback failed:", error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

revertAllMigrations();
