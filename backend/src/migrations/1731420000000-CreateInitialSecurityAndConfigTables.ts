import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialSecurityAndConfigTables1731420000000
  implements MigrationInterface
{
  name = "CreateInitialSecurityAndConfigTables1731420000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. PostgreSQL Schemas
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "config";`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "settings";`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "security";`);

    // 2. [config].[user_types]
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "config"."user_types" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "name" VARCHAR(50) NOT NULL,
        "code" VARCHAR(10) NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_on" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        "created_by" INT,
        "modified_on" TIMESTAMPTZ(3) DEFAULT now(),
        "modified_by" INT,
        "deleted_on" TIMESTAMPTZ(3),
        "deleted_by" INT,
        CONSTRAINT "uq_config_user_types_name" UNIQUE ("name"),
        CONSTRAINT "uq_config_user_types_code" UNIQUE ("code")
      );
    `);

    // 3. [config].[employment_types]
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "config"."employment_types" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "name" VARCHAR(50) NOT NULL,
        "code" VARCHAR(50) NOT NULL,
        "description" VARCHAR(250),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_on" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        "created_by" INT,
        "modified_on" TIMESTAMPTZ(3) DEFAULT now(),
        "modified_by" INT,
        "deleted_on" TIMESTAMPTZ(3),
        "deleted_by" INT,
        CONSTRAINT "uq_config_employment_types_name" UNIQUE ("name"),
        CONSTRAINT "uq_config_employment_types_code" UNIQUE ("code")
      );
    `);

    // 4. [settings].[erp_modules]
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "settings"."erp_modules" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "code" VARCHAR(50) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "display_order" INT NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_on" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        "created_by" INT,
        "modified_on" TIMESTAMPTZ(3) DEFAULT now(),
        "modified_by" INT,
        "deleted_on" TIMESTAMPTZ(3),
        "deleted_by" INT,
        CONSTRAINT "uq_settings_erp_modules_code" UNIQUE ("code")
      );
    `);

    // 5. [security].[roles]
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."roles" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "code" VARCHAR(50) NOT NULL,
        "description" VARCHAR(250),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_on" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        "created_by" INT,
        "modified_on" TIMESTAMPTZ(3) DEFAULT now(),
        "modified_by" INT,
        "deleted_on" TIMESTAMPTZ(3),
        "deleted_by" INT,
        CONSTRAINT "uq_security_roles_name" UNIQUE ("name"),
        CONSTRAINT "uq_security_roles_code" UNIQUE ("code")
      );
    `);

    // 6. [security].[permissions]
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."permissions" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "description" VARCHAR(250),
        "is_super_admin_only" BOOLEAN NOT NULL DEFAULT false,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_on" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        "created_by" INT,
        "modified_on" TIMESTAMPTZ(3) DEFAULT now(),
        "modified_by" INT,
        "deleted_on" TIMESTAMPTZ(3),
        "deleted_by" INT,
        CONSTRAINT "uq_security_permissions_name" UNIQUE ("name")
      );
    `);

    // 7. [security].[role_permissions]
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."role_permissions" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "role_id" INT NOT NULL,
        "permission_id" INT NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_on" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        "created_by" INT,
        "modified_on" TIMESTAMPTZ(3) DEFAULT now(),
        "modified_by" INT,
        "deleted_on" TIMESTAMPTZ(3),
        "deleted_by" INT,
        CONSTRAINT "uq_security_role_permissions_role_permission" UNIQUE ("role_id", "permission_id"),
        CONSTRAINT "fk_security_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "security"."roles"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_security_role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "security"."permissions"("id") ON DELETE CASCADE
      );
    `);

    // 8. [security].[users]
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."users" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "user_name" VARCHAR(50) NOT NULL,
        "email" VARCHAR(150) NOT NULL,
        "cell_phone" VARCHAR(20),
        "password_hash" TEXT NOT NULL,
        "user_type" SMALLINT DEFAULT NULL,
        "first_name" VARCHAR(150) NOT NULL,
        "middle_name" VARCHAR(150) NOT NULL DEFAULT '',
        "last_name" VARCHAR(150) NOT NULL,
        "image_path" TEXT,
        "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
        "verification_key" VARCHAR(100),
        "is_account_locked" BOOLEAN NOT NULL DEFAULT false,
        "failed_login_attempts" SMALLINT NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_on" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        "created_by" INT,
        "modified_on" TIMESTAMPTZ(3) DEFAULT now(),
        "modified_by" INT,
        "deleted_on" TIMESTAMPTZ(3),
        "deleted_by" INT
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_security_users_user_name" ON "security"."users" ("user_name");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_security_users_email" ON "security"."users" ("email")
      WHERE "email" IS NOT NULL AND "email" <> '';
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "ix_security_users_cell_phone" ON "security"."users" ("cell_phone");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "security"."users";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "security"."role_permissions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "security"."permissions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "security"."roles";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settings"."erp_modules";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "config"."employment_types";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "config"."user_types";`);
  }
}

