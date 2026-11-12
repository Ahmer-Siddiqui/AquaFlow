import "reflect-metadata";
import { AppDataSource } from "../../config/data-source.js";
import { EmploymentType } from "../../entities/config/employment-type.entity.js";
import {
  EmploymentTypeCode,
  EMPLOYMENT_TYPE_LABELS,
} from "../../constants/employment-type.enum.js";

export async function seedEmploymentTypes(shouldCloseConnection = true) {
  console.log("\n==========================================");
  console.log("🌱 SEEDING: [config].[employment_types]");
  console.log("==========================================");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await AppDataSource.query("CREATE SCHEMA IF NOT EXISTS config;");
  await AppDataSource.synchronize(false);

  const empTypeRepo = AppDataSource.getRepository(EmploymentType);

  const employmentTypesData = [
    {
      code: EmploymentTypeCode.PERMANENT,
      name: EMPLOYMENT_TYPE_LABELS[EmploymentTypeCode.PERMANENT],
      description: "Permanent salaried plant, office, and management staff",
    },
    {
      code: EmploymentTypeCode.CONTRACTUAL,
      name: EMPLOYMENT_TYPE_LABELS[EmploymentTypeCode.CONTRACTUAL],
      description: "Fixed-term contractual employees",
    },
    {
      code: EmploymentTypeCode.COMMISSION_BASED,
      name: EMPLOYMENT_TYPE_LABELS[EmploymentTypeCode.COMMISSION_BASED],
      description: "Delivery drivers and salesmen earning commission per bottle delivered",
    },
    {
      code: EmploymentTypeCode.DAILY_WAGES,
      name: EMPLOYMENT_TYPE_LABELS[EmploymentTypeCode.DAILY_WAGES],
      description: "Daily wage labor: bottle loaders, washers, and helpers",
    },
    {
      code: EmploymentTypeCode.TEMPORARY,
      name: EMPLOYMENT_TYPE_LABELS[EmploymentTypeCode.TEMPORARY],
      description: "Temporary seasonal workers during peak summer demand",
    },
    {
      code: EmploymentTypeCode.INTERNEE,
      name: EMPLOYMENT_TYPE_LABELS[EmploymentTypeCode.INTERNEE],
      description: "Trainees and interns",
    },
    {
      code: EmploymentTypeCode.SHORT_TERM,
      name: EMPLOYMENT_TYPE_LABELS[EmploymentTypeCode.SHORT_TERM],
      description: "Short-term project or trial workers",
    },
  ];

  for (const item of employmentTypesData) {
    const existing = await empTypeRepo.findOneBy({ code: item.code });
    if (!existing) {
      await empTypeRepo.save(empTypeRepo.create({ ...item, isActive: true }));
      console.log(`  + [CREATED] EmploymentType: ${item.code} - ${item.name}`);
    } else {
      console.log(`  ✓ [EXISTS]  EmploymentType: ${item.code} - ${item.name}`);
    }
  }

  const allTypes = await empTypeRepo.find({ order: { id: "ASC" } });
  console.log("\n📋 Current [config].[employment_types] in Database:");
  console.table(
    allTypes.map((e) => ({
      id: e.id,
      code: e.code,
      name: e.name,
      description: e.description,
      isActive: e.isActive,
    }))
  );

  if (shouldCloseConnection) {
    await AppDataSource.destroy();
    console.log("✅ EmploymentTypes seeding complete.\n");
  }
}

// Allow direct execution: `node dist/scripts/seeds/seed-employment-types.js`
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  seedEmploymentTypes(true).catch((err) => {
    console.error("❌ Failed to seed employment types:", err);
    process.exit(1);
  });
}

