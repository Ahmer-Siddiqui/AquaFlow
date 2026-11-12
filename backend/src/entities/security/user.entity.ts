import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "../base.entity.js";
import { UserType, UserTypeId } from "../../constants/user-type.enum.js";

export { UserType, UserTypeId };

@Entity({ schema: "security", name: "users" })
@Index("uq_security_users_user_name", ["userName"], { unique: true })
@Index("uq_security_users_email", ["email"], {
  unique: true,
  where: `"email" IS NOT NULL AND "email" <> ''`,
})
@Index("ix_security_users_cell_phone", ["cellPhone"])
export class User extends BaseEntity {
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
    default: UserTypeId.CLIENT_ADMIN,
  })
  userType!: number;

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
}
