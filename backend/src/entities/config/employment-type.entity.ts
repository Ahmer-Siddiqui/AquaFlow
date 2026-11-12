import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "../base.entity.js";

@Entity({ schema: "config", name: "employment_types" })
@Index("uq_config_employment_types_name", ["name"], { unique: true })
@Index("uq_config_employment_types_code", ["code"], { unique: true })
export class EmploymentType extends BaseEntity {
  @Column({ type: "varchar", length: 50, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  code!: string;

  @Column({ type: "varchar", length: 250, nullable: true })
  description?: string | null;
}

