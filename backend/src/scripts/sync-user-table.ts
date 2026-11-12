import "reflect-metadata";
import { AppDataSource } from "../config/data-source.js";

async function syncUserTable() {
  console.log("Connecting to Supabase PostgreSQL database...");
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection initialized.");

    // Ensure the 'security' schema exists in PostgreSQL
    await AppDataSource.query("CREATE SCHEMA IF NOT EXISTS security;");
    console.log("✅ Schema 'security' verified/created.");

    // Synchronize the User entity table
    console.log("Synchronizing 'security.users' table schema...");
    await AppDataSource.synchronize(false);
    console.log("✅ 'security.users' table successfully synchronized in database!");

    // Verify columns from information_schema
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
    console.error("❌ Error synchronizing user table:", error);
    process.exit(1);
  }
}

syncUserTable();

