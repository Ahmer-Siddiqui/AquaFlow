import "reflect-metadata";
import { AppDataSource } from "../../config/data-source.js";
import { seedUserTypes } from "./seed-user-types.js";
import { seedRoles } from "./seed-roles.js";
import { seedPermissions } from "./seed-permissions.js";
import { seedEmploymentTypes } from "./seed-employment-types.js";

async function runAllSeeds() {
  console.log("🚀 Starting Master AquaFlow Database Seeding Pipeline...\n");
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ Database connection established.");
    }

    // Run seeders in order (without closing connection between each)
    await seedUserTypes(false);
    await seedRoles(false);
    await seedPermissions(false);
    await seedEmploymentTypes(false);

    await AppDataSource.destroy();
    console.log("🎉 ALL SEEDING SCRIPTS EXECUTED SUCCESSFULLY!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Pipeline encountered an error:", error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

runAllSeeds();

