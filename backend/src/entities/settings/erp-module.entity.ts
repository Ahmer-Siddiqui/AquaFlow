import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "../base.entity.js";

@Entity({ schema: "settings", name: "erp_modules" })
@Index("uq_settings_erp_modules_code", ["code"], { unique: true })
export class ErpModule extends BaseEntity {
  @Column({ type: "varchar", length: 50, unique: true })
  code!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ type: "int", default: 0, name: "display_order" })
  displayOrder!: number;
}
