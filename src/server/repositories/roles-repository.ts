import type { PermissionRecord, RoleRecord } from "./repository-types";

export interface RolesRepository {
  findById(id: string): Promise<RoleRecord | null>;
  findByCode(roleCode: string): Promise<RoleRecord | null>;
  listRoles(): Promise<RoleRecord[]>;
  listPermissionsForRole(roleCode: string): Promise<PermissionRecord[]>;
}
