import "reflect-metadata";
import { AppDataSource } from "../../config/data-source.js";
import { UserTypeEntity } from "../../entities/config/user-type.entity.js";
import { UserType, UserTypeCode } from "../../constants/user-type.enum.js";

export async function seedUserTypes(shouldCloseConnection = true) {
  console.log("\n==========================================");
  console.log("🌱 SEEDING: [config].[user_types]");
  console.log("==========================================");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userTypeRepo = AppDataSource.getRepository(UserTypeEntity);

  const userTypesData = [
    { name: UserType.SUPER_ADMIN, code: UserTypeCode.SUPER_ADMIN },
    { name: UserType.CLIENT_ADMIN, code: UserTypeCode.CLIENT_ADMIN },
    { name: UserType.EMPLOYEE, code: UserTypeCode.EMPLOYEE },
    { name: UserType.DELIVERY_DRIVER, code: UserTypeCode.DELIVERY_DRIVER },
    { name: UserType.CUSTOMER, code: UserTypeCode.CUSTOMER },
  ];

  for (const item of userTypesData) {
    const existing = await userTypeRepo.findOneBy({ code: item.code });
    if (!existing) {
      await userTypeRepo.save(userTypeRepo.create({ ...item, isActive: true }));
      console.log(`  + [CREATED] UserType: ${item.code} - ${item.name}`);
    } else {
      console.log(`  ✓ [EXISTS]  UserType: ${item.code} - ${item.name}`);
    }
  }

  const allUserTypes = await userTypeRepo.find({ order: { id: "ASC" } });
  console.log("\n📋 Current [config].[user_types] in Database:");
  console.table(
    allUserTypes.map((u) => ({
      id: u.id,
      code: u.code,
      name: u.name,
      isActive: u.isActive,
    }))
  );

  if (shouldCloseConnection) {
    await AppDataSource.destroy();
    console.log("✅ UserTypes seeding complete.\n");
  }
}

// Allow direct execution: `node dist/scripts/seeds/seed-user-types.js`
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  seedUserTypes(true).catch((err) => {
    console.error("❌ Failed to seed user types:", err);
    process.exit(1);
  });
}

