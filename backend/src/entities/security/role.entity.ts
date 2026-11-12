import { Entity, Column, Index, OneToMany, type Relation } from "typeorm";
import { BaseEntity } from "../base.entity.js";
import type { RolePermission } from "./role-permission.entity.js";

@Entity({ schema: "security", name: "roles" })
@Index("uq_security_roles_name", ["name"], { unique: true })
@Index("uq_security_roles_code", ["code"], { unique: true })
export class Role extends BaseEntity {
  @Column({ type: "varchar", length: 100, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  code!: string;

  @Column({ type: "varchar", length: 250, nullable: true })
  description?: string | null;

  @OneToMany("RolePermission", (rp: RolePermission) => rp.role)
  rolePermissions?: Relation<RolePermission>[];
}
