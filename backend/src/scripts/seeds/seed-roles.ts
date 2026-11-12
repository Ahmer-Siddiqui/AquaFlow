import "reflect-metadata";
import { AppDataSource } from "../../config/data-source.js";
import { Role } from "../../entities/security/role.entity.js";
import { RoleCode } from "../../constants/role.enum.js";

export async function seedRoles(shouldCloseConnection = true) {
  console.log("\n==========================================");
  console.log("🌱 SEEDING: [security].[roles]");
  console.log("==========================================");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const roleRepo = AppDataSource.getRepository(Role);

  const rolesData = [
    {
      name: "SuperAdmin",
      code: RoleCode.SUPER_ADMIN,
      description: "SaaS Platform Super Administrator (Platform Owner)",
    },
    {
      name: "ClientAdmin",
      code: RoleCode.CLIENT_ADMIN,
      description: "Water Plant & Business Enterprise Administrator",
    },
    {
      name: "Employee",
      code: RoleCode.EMPLOYEE,
      description: "Plant & Office Staff (Manager, Accountant, Dispatcher)",
    },
    {
      name: "DeliveryDriver",
      code: RoleCode.DELIVERY_DRIVER,
      description: "Water Delivery Route & Van Operator",
    },
    {
      name: "Customer",
      code: RoleCode.CUSTOMER,
      description: "Residential & Commercial Consumer Client",
    },
  ];

  for (const item of rolesData) {
    const existing = await roleRepo.findOneBy({ code: item.code });
    if (!existing) {
      await roleRepo.save(roleRepo.create({ ...item, isActive: true }));
      console.log(`  + [CREATED] Role: ${item.code} - ${item.name}`);
    } else {
      console.log(`  ✓ [EXISTS]  Role: ${item.code} - ${item.name}`);
    }
  }

  const allRoles = await roleRepo.find({ order: { id: "ASC" } });
  console.log("\n📋 Current [security].[roles] in Database:");
  console.table(
    allRoles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      isActive: r.isActive,
    }))
  );

  if (shouldCloseConnection) {
    await AppDataSource.destroy();
    console.log("✅ Roles seeding complete.\n");
  }
}

// Allow direct execution: `node dist/scripts/seeds/seed-roles.js`
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  seedRoles(true).catch((err) => {
    console.error("❌ Failed to seed roles:", err);
    process.exit(1);
  });
}

