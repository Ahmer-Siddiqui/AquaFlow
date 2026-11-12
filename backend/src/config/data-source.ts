import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/security/user.entity.js";
import { ErpModule } from "../entities/settings/erp-module.entity.js";
import { UserTypeEntity } from "../entities/config/user-type.entity.js";
import { Role } from "../entities/security/role.entity.js";
import { Permission } from "../entities/security/permission.entity.js";
import { RolePermission } from "../entities/security/role-permission.entity.js";
import { EmploymentType } from "../entities/config/employment-type.entity.js";
import { CreateInitialSecurityAndConfigTables1731420000000 } from "../migrations/1731420000000-CreateInitialSecurityAndConfigTables.js";
import { SeedInitialSecurityAndConfigData1731420001000 } from "../migrations/1731420001000-SeedInitialSecurityAndConfigData.js";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase SSL connection
  },
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [
    User,
    ErpModule,
    UserTypeEntity,
    Role,
    Permission,
    RolePermission,
    EmploymentType,
  ],
  migrations: [
    CreateInitialSecurityAndConfigTables1731420000000,
    SeedInitialSecurityAndConfigData1731420001000,
  ],
  subscribers: [],
});


