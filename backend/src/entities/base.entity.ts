import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";

/**
 * Master Abstract Base Entity
 * Centralizes primary key and enterprise audit columns across all AquaFlow entities:
 * - id: Auto-increment integer primary key (number)
 * - isActive: Operational status flag (is_active)
 * - createdOn: Creation timestamp with timezone (created_on)
 * - createdBy: User ID who created the record (created_by)
 * - modifiedOn: Last modification timestamp with timezone (modified_on)
 * - modifiedBy: User ID who modified the record (modified_by)
 * - deletedOn: Soft-delete timestamp for TypeORM soft-delete engine (deleted_on)
 * - deletedBy: User ID who deleted/archived the record (deleted_by)
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ type: "boolean", default: true, name: "is_active" })
  isActive!: boolean;

  @CreateDateColumn({ type: "timestamptz", precision: 3, name: "created_on" })
  createdOn!: Date;

  @Column({ type: "int", nullable: true, name: "created_by" })
  createdBy?: number | null;

  @UpdateDateColumn({
    type: "timestamptz",
    precision: 3,
    nullable: true,
    name: "modified_on",
  })
  modifiedOn?: Date | null;

  @Column({ type: "int", nullable: true, name: "modified_by" })
  modifiedBy?: number | null;

  @DeleteDateColumn({
    type: "timestamptz",
    precision: 3,
    nullable: true,
    name: "deleted_on",
  })
  deletedOn?: Date | null;

  @Column({ type: "int", nullable: true, name: "deleted_by" })
  deletedBy?: number | null;
}

