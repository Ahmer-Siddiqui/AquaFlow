import { Entity, Column, Index, OneToMany, type Relation } from "typeorm";
import { BaseEntity } from "../base.entity.js";
import type { RolePermission } from "./role-permission.entity.js";

@Entity({ schema: "security", name: "permissions" })
@Index("uq_security_permissions_name", ["name"], { unique: true })
export class Permission extends BaseEntity {
  @Column({ type: "varchar", length: 100, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 250, nullable: true })
  description?: string | null;

  @Column({
    type: "boolean",
    default: false,
    name: "is_super_admin_only",
  })
  isSuperAdminOnly!: boolean;

  @OneToMany("RolePermission", (rp: RolePermission) => rp.permission)
  rolePermissions?: Relation<RolePermission>[];
}
