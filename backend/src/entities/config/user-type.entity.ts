import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "../base.entity.js";

@Entity({ schema: "config", name: "user_types" })
@Index("uq_config_user_types_name", ["name"], { unique: true })
@Index("uq_config_user_types_code", ["code"], { unique: true })
export class UserTypeEntity extends BaseEntity {
  @Column({ type: "varchar", length: 50, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 10, unique: true })
  code!: string;
}
