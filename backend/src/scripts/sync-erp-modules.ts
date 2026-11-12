import "reflect-metadata";
import { AppDataSource } from "../config/data-source.js";
import { ErpModule } from "../entities/settings/erp-module.entity.js";

async function syncErpModulesTable() {
  console.log("Connecting to Supabase PostgreSQL database...");
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection initialized.");

    // Ensure the 'settings' schema exists in PostgreSQL
    await AppDataSource.query("CREATE SCHEMA IF NOT EXISTS settings;");
    console.log("✅ Schema 'settings' verified/created.");

    // Synchronize the ErpModule entity table
    console.log("Synchronizing 'settings.erp_modules' table schema...");
    await AppDataSource.synchronize(false);
    console.log("✅ 'settings.erp_modules' table successfully synchronized!");

    // Seed Core ERP Modules
    const moduleRepo = AppDataSource.getRepository(ErpModule);
    const standardModules = [
      { code: "CORE_POS", name: "Point of Sale & Orders", description: "One-time orders, counter sales, and customer catalog", displayOrder: 1 },
      { code: "BOTTLE_LEDGER", name: "Empty Bottle Asset Ledger", description: "19L/12L full delivered, empty returned, deposit tracking & reconciliation", displayOrder: 2 },
      { code: "SUBSCRIPTION_ENGINE", name: "Recurring Delivery Plans", description: "Daily, weekly, alternate-day automated subscription dispatch", displayOrder: 3 },
      { code: "FLEET_GATE_PASS", name: "Vehicle Dispatch & Gate Pass", description: "Truck bottle load sheets, plant gate out/in & driver cash reconciliation", displayOrder: 4 },
      { code: "VOUCHER_BILLING", name: "Monthly Billing & Arrears", description: "Postpaid monthly billing challans, late fees & arrears carry-forward", displayOrder: 5 },
      { code: "PLANT_INVENTORY", name: "Bottling & Stock Operations", description: "Full, empty dirty, empty clean, and damaged bottle inventory tracking", displayOrder: 6 },
      { code: "HR_PAYROLL", name: "Staff & Driver Management", description: "Employee master, driver commissions per bottle, attendances & leave", displayOrder: 7 },
      { code: "NOTIFICATIONS", name: "Alerts & Outbox", description: "Multi-channel SMS, WhatsApp, Email, and In-App notification engine", displayOrder: 8 },
    ];

    for (const mod of standardModules) {
      const exists = await moduleRepo.findOneBy({ code: mod.code });
      if (!exists) {
        await moduleRepo.save(moduleRepo.create({ ...mod, isActive: true }));
        console.log(`  + Seeded ERP Module: [${mod.code}] - ${mod.name}`);
      } else {
        console.log(`  ✓ Already exists: [${mod.code}]`);
      }
    }

    // Verify columns from information_schema
    const columns = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'settings' AND table_name = 'erp_modules'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 Table Structure for [settings].[erp_modules]:");
    console.table(columns);

    // List seeded rows
    const allModules = await moduleRepo.find({ order: { displayOrder: "ASC" } });
    console.log("\n📦 Seeded ERP Modules:");
    console.table(allModules.map(m => ({ id: m.id, code: m.code, name: m.name, active: m.isActive })));

    await AppDataSource.destroy();
    console.log("\n✅ Done.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error synchronizing erp_modules table:", error);
    process.exit(1);
  }
}

syncErpModulesTable();

