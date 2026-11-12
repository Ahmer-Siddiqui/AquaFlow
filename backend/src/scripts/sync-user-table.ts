import "reflect-metadata";
import { AppDataSource } from "../config/data-source.js";

async function showUserTableStructure() {
  console.log("Connecting to Supabase PostgreSQL database...");
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection initialized.");

    const columns = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'security' AND table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 Table Structure for [security].[users]:");
    console.table(columns);

    await AppDataSource.destroy();
    console.log("\n✅ Done.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fetching user table schema:", error);
    process.exit(1);
  }
}

showUserTableStructure();
