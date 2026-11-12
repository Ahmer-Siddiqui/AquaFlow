import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum UserType {
  SUPER_ADMIN = 1,
  BUSINESS_ADMIN = 2,
  EMPLOYEE_DRIVER = 3,
  CUSTOMER = 4,
}

@Entity({ schema: "security", name: "users" })
@Index("uq_security_users_user_name", ["userName"], { unique: true })
@Index("uq_security_users_email", ["email"], {
  unique: true,
  where: `"email" IS NOT NULL AND "email" <> ''`,
})
@Index("ix_security_users_cell_phone", ["cellPhone"])
export class User {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ type: "varchar", length: 50, name: "user_name" })
  userName!: string;

  @Column({ type: "varchar", length: 150, name: "email" })
  email!: string;

  @Column({ type: "varchar", length: 20, nullable: true, name: "cell_phone" })
  cellPhone?: string | null;

  @Column({ type: "text", name: "password_hash", select: false })
  passwordHash!: string;

  @Column({
    type: "smallint",
    name: "user_type",
    default: UserType.BUSINESS_ADMIN,
  })
  userType!: UserType;

  @Column({ type: "varchar", length: 150, name: "first_name" })
  firstName!: string;

  @Column({ type: "varchar", length: 150, default: "", name: "middle_name" })
  middleName!: string;

  @Column({ type: "varchar", length: 150, name: "last_name" })
  lastName!: string;

  @Column({ type: "text", nullable: true, name: "image_path" })
  imagePath?: string | null;

  @Column({ type: "boolean", default: false, name: "is_email_verified" })
  isEmailVerified!: boolean;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    name: "verification_key",
  })
  verificationKey?: string | null;

  @Column({ type: "boolean", default: false, name: "is_account_locked" })
  isAccountLocked!: boolean;

  @Column({ type: "smallint", default: 0, name: "failed_login_attempts" })
  failedLoginAttempts!: number;

  @Column({ type: "boolean", default: true, name: "active" })
  active!: boolean;

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

  @Column({ type: "boolean", default: false, name: "is_deleted" })
  isDeleted!: boolean;
}

