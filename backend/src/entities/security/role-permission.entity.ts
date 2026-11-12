import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  type Relation,
} from "typeorm";
import { BaseEntity } from "../base.entity.js";
import type { Role } from "./role.entity.js";
import type { Permission } from "./permission.entity.js";

@Entity({ schema: "security", name: "role_permissions" })
@Index(
  "uq_security_role_permissions_role_permission",
  ["roleId", "permissionId"],
  { unique: true }
)
export class RolePermission extends BaseEntity {
  @Column({ type: "int", name: "role_id" })
  roleId!: number;

  @Column({ type: "int", name: "permission_id" })
  permissionId!: number;

  @ManyToOne("Role", (role: Role) => role.rolePermissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "role_id" })
  role?: Relation<Role>;

  @ManyToOne(
    "Permission",
    (permission: Permission) => permission.rolePermissions,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "permission_id" })
  permission?: Relation<Permission>;
}
