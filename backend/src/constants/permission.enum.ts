/**
 * System Permissions
 * Atomic permission slugs mapped to security.permissions.name
 * Note: Keeping strictly to `dashboard:read` for now as requested.
 * New permissions will be added incrementally as modules are developed.
 */
export enum PermissionCode {
  DASHBOARD_READ = "dashboard:read",
}

export const PERMISSION_DESCRIPTIONS: Record<PermissionCode, string> = {
  [PermissionCode.DASHBOARD_READ]: "Allows viewing operational and analytical dashboard metrics",
};

