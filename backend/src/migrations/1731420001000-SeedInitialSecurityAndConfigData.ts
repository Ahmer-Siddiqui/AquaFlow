import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedInitialSecurityAndConfigData1731420001000
  implements MigrationInterface
{
  name = "SeedInitialSecurityAndConfigData1731420001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Seed [config].[user_types]
    await queryRunner.query(`
      INSERT INTO "config"."user_types" ("name", "code", "is_active")
      VALUES
        ('SuperAdmin', 'SA', true),
        ('ClientAdmin', 'CA', true),
        ('Employee', 'EM', true),
        ('DeliveryDriver', 'DD', true),
        ('Customer', 'CU', true)
      ON CONFLICT ("code") DO NOTHING;
    `);

    // 2. Seed [config].[employment_types]
    await queryRunner.query(`
      INSERT INTO "config"."employment_types" ("code", "name", "description", "is_active")
      VALUES
        ('Permanent', 'Permanent', 'Permanent salaried plant, office, and management staff', true),
        ('Contractual', 'Contractual', 'Fixed-term contractual employees', true),
        ('CommissionBased', 'Commission Based', 'Delivery drivers and salesmen earning commission per bottle delivered', true),
        ('DailyWages', 'Daily Wages', 'Daily wage labor: bottle loaders, washers, and helpers', true),
        ('Temporary', 'Temporary', 'Temporary seasonal workers during peak summer demand', true),
        ('Internee', 'Internee', 'Trainees and interns', true),
        ('ShortTerm', 'Short Term', 'Short-term project or trial workers', true)
      ON CONFLICT ("code") DO NOTHING;
    `);

    // 3. Seed [settings].[erp_modules]
    await queryRunner.query(`
      INSERT INTO "settings"."erp_modules" ("code", "name", "description", "display_order", "is_active")
      VALUES
        ('CORE_POS', 'Point of Sale & Orders', 'One-time orders, counter sales, and customer catalog', 1, true),
        ('BOTTLE_LEDGER', 'Empty Bottle Asset Ledger', '19L/12L full delivered, empty returned, deposit tracking & reconciliation', 2, true),
        ('SUBSCRIPTION_ENGINE', 'Recurring Delivery Plans', 'Daily, weekly, alternate-day automated subscription dispatch', 3, true),
        ('FLEET_GATE_PASS', 'Vehicle Dispatch & Gate Pass', 'Truck bottle load sheets, plant gate out/in & driver cash reconciliation', 4, true),
        ('VOUCHER_BILLING', 'Monthly Billing & Arrears', 'Postpaid monthly billing challans, late fees & arrears carry-forward', 5, true),
        ('PLANT_INVENTORY', 'Bottling & Stock Operations', 'Full, empty dirty, empty clean, and damaged bottle inventory tracking', 6, true),
        ('HR_PAYROLL', 'Staff & Driver Management', 'Employee master, driver commissions per bottle, attendances & leave', 7, true),
        ('NOTIFICATIONS', 'Alerts & Outbox', 'Multi-channel SMS, WhatsApp, Email, and In-App notification engine', 8, true)
      ON CONFLICT ("code") DO NOTHING;
    `);

    // 4. Seed [security].[roles]
    await queryRunner.query(`
      INSERT INTO "security"."roles" ("name", "code", "description", "is_active")
      VALUES
        ('SuperAdmin', 'SA', 'SaaS Platform Super Administrator (Platform Owner)', true),
        ('ClientAdmin', 'CA', 'Water Plant & Business Enterprise Administrator', true),
        ('Employee', 'EM', 'Plant & Office Staff (Manager, Accountant, Dispatcher)', true),
        ('DeliveryDriver', 'DD', 'Water Delivery Route & Van Operator', true),
        ('Customer', 'CU', 'Residential & Commercial Consumer Client', true)
      ON CONFLICT ("code") DO NOTHING;
    `);

    // 5. Seed [security].[permissions]
    await queryRunner.query(`
      INSERT INTO "security"."permissions" ("name", "description", "is_super_admin_only", "is_active")
      VALUES
        ('dashboard:read', 'Allows viewing operational and analytical dashboard metrics', false, true)
      ON CONFLICT ("name") DO NOTHING;
    `);

    // 6. Seed [security].[role_permissions]
    await queryRunner.query(`
      INSERT INTO "security"."role_permissions" ("role_id", "permission_id", "is_active")
      SELECT r.id, p.id, true
      FROM "security"."roles" r
      CROSS JOIN "security"."permissions" p
      WHERE r.code IN ('CA', 'EM') AND p.name = 'dashboard:read'
      ON CONFLICT ("role_id", "permission_id") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "security"."role_permissions"
      WHERE "permission_id" IN (SELECT id FROM "security"."permissions" WHERE name = 'dashboard:read');
    `);
    await queryRunner.query(`
      DELETE FROM "security"."permissions" WHERE name = 'dashboard:read';
    `);
    await queryRunner.query(`
      DELETE FROM "security"."roles" WHERE code IN ('SA', 'CA', 'EM', 'DD', 'CU');
    `);
    await queryRunner.query(`
      DELETE FROM "settings"."erp_modules" WHERE code IN (
        'CORE_POS', 'BOTTLE_LEDGER', 'SUBSCRIPTION_ENGINE', 'FLEET_GATE_PASS',
        'VOUCHER_BILLING', 'PLANT_INVENTORY', 'HR_PAYROLL', 'NOTIFICATIONS'
      );
    `);
    await queryRunner.query(`
      DELETE FROM "config"."employment_types" WHERE code IN (
        'Permanent', 'Contractual', 'CommissionBased', 'DailyWages',
        'Temporary', 'Internee', 'ShortTerm'
      );
    `);
    await queryRunner.query(`
      DELETE FROM "config"."user_types" WHERE code IN ('SA', 'CA', 'EM', 'DD', 'CU');
    `);
  }
}

