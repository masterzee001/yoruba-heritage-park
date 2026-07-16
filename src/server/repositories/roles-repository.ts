import type { PermissionRecord, RoleRecord } from "./repository-types";

export interface RolesRepository {
  findById(id: string): Promise<RoleRecord | null>;
  findByCode(roleCode: string): Promise<RoleRecord | null>;
  listRoles(): Promise<RoleRecord[]>;
  countUsersByRole(): Promise<Record<string, number>>;
  listPermissionsForRole(roleCode: string): Promise<PermissionRecord[]>;
  listRolesForUser(userId: string): Promise<RoleRecord[]>;
  listPermissionsForUser(userId: string): Promise<PermissionRecord[]>;
  setUserRoles(userId: string, roleCodes: string[], assignedByUserId: string): Promise<void>;
  permissionExists(permissionCode: string): Promise<boolean>;
}
