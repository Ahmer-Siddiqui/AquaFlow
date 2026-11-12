import "reflect-metadata";
import { AppDataSource } from "../config/data-source.js";
import { UserTypeEntity } from "../entities/config/user-type.entity.js";
import { Role } from "../entities/security/role.entity.js";
import { Permission } from "../entities/security/permission.entity.js";
import { RolePermission } from "../entities/security/role-permission.entity.js";
import { UserType, UserTypeCode } from "../constants/user-type.enum.js";
import { RoleCode } from "../constants/role.enum.js";
import { PermissionCode, PERMISSION_DESCRIPTIONS } from "../constants/permission.enum.js";

async function syncAndSeedSecurityTables() {
  console.log("Connecting to Supabase PostgreSQL database...");
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection initialized.");

    // 1. Ensure required PostgreSQL schemas exist
    await AppDataSource.query("CREATE SCHEMA IF NOT EXISTS config;");
    await AppDataSource.query("CREATE SCHEMA IF NOT EXISTS security;");
    console.log("✅ Schemas 'config' and 'security' verified/created.");

    // 2. Synchronize entities into database
    console.log("Synchronizing schema tables (user_types, roles, permissions, role_permissions)...");
    await AppDataSource.synchronize(false);
    console.log("✅ Database tables successfully synchronized!");

    // 3. Dump / Seed [config].[user_types]
    const userTypeRepo = AppDataSource.getRepository(UserTypeEntity);
    const initialUserTypes = [
      { name: UserType.SUPER_ADMIN, code: UserTypeCode.SUPER_ADMIN },
      { name: UserType.CLIENT_ADMIN, code: UserTypeCode.CLIENT_ADMIN },
      { name: UserType.EMPLOYEE, code: UserTypeCode.EMPLOYEE },
      { name: UserType.DELIVERY_DRIVER, code: UserTypeCode.DELIVERY_DRIVER },
      { name: UserType.CUSTOMER, code: UserTypeCode.CUSTOMER },
    ];

    console.log("\n--- Seeding [config].[user_types] ---");
    for (const ut of initialUserTypes) {
      const exists = await userTypeRepo.findOneBy({ code: ut.code });
      if (!exists) {
        await userTypeRepo.save(userTypeRepo.create({ ...ut, isActive: true }));
        console.log(`  + Seeded UserType: [${ut.code}] - ${ut.name}`);
      } else {
        console.log(`  ✓ Already exists: [${ut.code}] - ${ut.name}`);
      }
    }

    // 4. Dump / Seed [security].[roles]
    const roleRepo = AppDataSource.getRepository(Role);
    const initialRoles = [
      { name: "SuperAdmin", code: RoleCode.SUPER_ADMIN, description: "System Platform Super Administrator" },
      { name: "ClientAdmin", code: RoleCode.CLIENT_ADMIN, description: "Water Plant / Business Administrator" },
      { name: "Employee", code: RoleCode.EMPLOYEE, description: "Office / Plant Staff (Manager, Accountant, Dispatcher)" },
      { name: "DeliveryDriver", code: RoleCode.DELIVERY_DRIVER, description: "Water Delivery Route & Van Driver" },
      { name: "Customer", code: RoleCode.CUSTOMER, description: "Residential & Commercial Water Consumer" },
    ];

    console.log("\n--- Seeding [security].[roles] ---");
    for (const r of initialRoles) {
      const exists = await roleRepo.findOneBy({ code: r.code });
      if (!exists) {
        await roleRepo.save(roleRepo.create({ ...r, isActive: true }));
        console.log(`  + Seeded Role: [${r.code}] - ${r.name}`);
      } else {
        console.log(`  ✓ Already exists: [${r.code}] - ${r.name}`);
      }
    }

    // 5. Dump / Seed [security].[permissions]
    const permRepo = AppDataSource.getRepository(Permission);
    const initialPermissions = [
      {
        name: PermissionCode.DASHBOARD_READ,
        description: PERMISSION_DESCRIPTIONS[PermissionCode.DASHBOARD_READ],
        isSuperAdminOnly: false,
      },
    ];

    console.log("\n--- Seeding [security].[permissions] ---");
    for (const p of initialPermissions) {
      const exists = await permRepo.findOneBy({ name: p.name });
      if (!exists) {
        await permRepo.save(permRepo.create({ ...p, isActive: true }));
        console.log(`  + Seeded Permission: ${p.name}`);
      } else {
        console.log(`  ✓ Already exists: ${p.name}`);
      }
    }

    // 6. Dump / Seed [security].[role_permissions]
    const rolePermRepo = AppDataSource.getRepository(RolePermission);
    const allRoles = await roleRepo.find();
    const dashboardPerm = await permRepo.findOneBy({ name: PermissionCode.DASHBOARD_READ });

    if (dashboardPerm) {
      console.log("\n--- Seeding [security].[role_permissions] ---");
      // Map dashboard:read to ClientAdmin and Employee roles
      const eligibleRoles = allRoles.filter(
        (r) => r.code === RoleCode.CLIENT_ADMIN || r.code === RoleCode.EMPLOYEE
      );

      for (const role of eligibleRoles) {
        const exists = await rolePermRepo.findOneBy({
          roleId: role.id,
          permissionId: dashboardPerm.id,
        });
        if (!exists) {
          await rolePermRepo.save(
            rolePermRepo.create({
              roleId: role.id,
              permissionId: dashboardPerm.id,
              isActive: true,
            })
          );
          console.log(`  + Mapped Role [${role.code}] -> Permission [${dashboardPerm.name}]`);
        } else {
          console.log(`  ✓ Role [${role.code}] -> Permission [${dashboardPerm.name}] already mapped`);
        }
      }
    }

    // 7. Verify Seeded Records
    console.log("\n📦 Seeded [config].[user_types]:");
    const userTypesList = await userTypeRepo.find({ order: { id: "ASC" } });
    console.table(userTypesList.map((u) => ({ id: u.id, code: u.code, name: u.name, isActive: u.isActive })));

    console.log("\n📦 Seeded [security].[roles]:");
    const rolesList = await roleRepo.find({ order: { id: "ASC" } });
    console.table(rolesList.map((r) => ({ id: r.id, code: r.code, name: r.name, isActive: r.isActive })));

    console.log("\n📦 Seeded [security].[permissions]:");
    const permsList = await permRepo.find({ order: { id: "ASC" } });
    console.table(permsList.map((p) => ({ id: p.id, name: p.name, isSuperAdminOnly: p.isSuperAdminOnly })));

    console.log("\n📦 Seeded [security].[role_permissions]:");
    const rolePermsList = await rolePermRepo.find({
      relations: { role: true, permission: true },
    });
    console.table(
      rolePermsList.map((rp) => ({
        id: rp.id,
        role: rp.role?.name,
        roleCode: rp.role?.code,
        permission: rp.permission?.name,
      }))
    );

    await AppDataSource.destroy();
    console.log("\n✅ Security and UserType tables synchronization and data dump complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error synchronizing security tables:", error);
    process.exit(1);
  }
}

syncAndSeedSecurityTables();
