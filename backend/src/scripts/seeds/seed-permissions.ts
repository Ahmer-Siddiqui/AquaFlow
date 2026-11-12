import "reflect-metadata";
import { AppDataSource } from "../../config/data-source.js";
import { Permission } from "../../entities/security/permission.entity.js";
import { Role } from "../../entities/security/role.entity.js";
import { RolePermission } from "../../entities/security/role-permission.entity.js";
import { RoleCode } from "../../constants/role.enum.js";
import {
  PermissionCode,
  PERMISSION_DESCRIPTIONS,
} from "../../constants/permission.enum.js";

export async function seedPermissions(shouldCloseConnection = true) {
  console.log("\n==========================================");
  console.log("🌱 SEEDING: [security].[permissions] & [security].[role_permissions]");
  console.log("==========================================");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await AppDataSource.query("CREATE SCHEMA IF NOT EXISTS security;");
  await AppDataSource.synchronize(false);

  const permRepo = AppDataSource.getRepository(Permission);
  const roleRepo = AppDataSource.getRepository(Role);
  const rolePermRepo = AppDataSource.getRepository(RolePermission);

  // 1. Seed Permissions
  const permissionsData = [
    {
      name: PermissionCode.DASHBOARD_READ,
      description: PERMISSION_DESCRIPTIONS[PermissionCode.DASHBOARD_READ],
      isSuperAdminOnly: false,
    },
  ];

  for (const item of permissionsData) {
    const existing = await permRepo.findOneBy({ name: item.name });
    if (!existing) {
      await permRepo.save(permRepo.create({ ...item, isActive: true }));
      console.log(`  + [CREATED] Permission: ${item.name}`);
    } else {
      console.log(`  ✓ [EXISTS]  Permission: ${item.name}`);
    }
  }

  // 2. Map Permissions to Roles
  const allRoles = await roleRepo.find();
  const dashboardPerm = await permRepo.findOneBy({
    name: PermissionCode.DASHBOARD_READ,
  });

  if (dashboardPerm) {
    const rolesToAssign = allRoles.filter(
      (r) => r.code === RoleCode.CLIENT_ADMIN || r.code === RoleCode.EMPLOYEE
    );

    for (const role of rolesToAssign) {
      const existing = await rolePermRepo.findOneBy({
        roleId: role.id,
        permissionId: dashboardPerm.id,
      });

      if (!existing) {
        await rolePermRepo.save(
          rolePermRepo.create({
            roleId: role.id,
            permissionId: dashboardPerm.id,
            isActive: true,
          })
        );
        console.log(
          `  + [MAPPED] Role [${role.code}] -> Permission [${dashboardPerm.name}]`
        );
      } else {
        console.log(
          `  ✓ [EXISTS] Role [${role.code}] -> Permission [${dashboardPerm.name}]`
        );
      }
    }
  }

  const allPerms = await permRepo.find({ order: { id: "ASC" } });
  console.log("\n📋 Current [security].[permissions] in Database:");
  console.table(
    allPerms.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isSuperAdminOnly: p.isSuperAdminOnly,
      isActive: p.isActive,
    }))
  );

  const allRolePerms = await rolePermRepo.find({
    relations: { role: true, permission: true },
  });
  console.log("\n📋 Current [security].[role_permissions] Mappings:");
  console.table(
    allRolePerms.map((rp) => ({
      id: rp.id,
      role: rp.role?.name,
      roleCode: rp.role?.code,
      permission: rp.permission?.name,
    }))
  );

  if (shouldCloseConnection) {
    await AppDataSource.destroy();
    console.log("✅ Permissions & RolePermissions seeding complete.\n");
  }
}

// Allow direct execution: `node dist/scripts/seeds/seed-permissions.js`
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  seedPermissions(true).catch((err) => {
    console.error("❌ Failed to seed permissions:", err);
    process.exit(1);
  });
}

