/**
 * System Role Codes & Names
 * Used for role assignment (security.roles.code / security.roles.name) and RBAC checks
 */
export enum RoleCode {
  SUPER_ADMIN = "SA",
  CLIENT_ADMIN = "CA",
  EMPLOYEE = "EM",
  DELIVERY_DRIVER = "DD",
  CUSTOMER = "CU",
}

export enum RoleName {
  SUPER_ADMIN = "SuperAdmin",
  CLIENT_ADMIN = "ClientAdmin",
  EMPLOYEE = "Employee",
  DELIVERY_DRIVER = "DeliveryDriver",
  CUSTOMER = "Customer",
}

export const ROLE_LABELS: Record<RoleCode, string> = {
  [RoleCode.SUPER_ADMIN]: "Super Administrator",
  [RoleCode.CLIENT_ADMIN]: "Client Administrator",
  [RoleCode.EMPLOYEE]: "Employee",
  [RoleCode.DELIVERY_DRIVER]: "Delivery Driver",
  [RoleCode.CUSTOMER]: "Customer",
};
