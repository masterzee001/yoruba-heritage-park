import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

import { getDatabasePool, toDatabaseError } from "../../db";
import type { PermissionRecord, RoleRecord } from "../repository-types";
import type { RolesRepository } from "../roles-repository";
import { requireCode, requireId } from "./mysql-helpers";

interface RoleRow extends RowDataPacket {
  id: string;
  role_code: string;
  display_name: string;
  description: string | null;
  is_system_role: 0 | 1;
  created_at: Date;
  updated_at: Date;
}

interface PermissionRow extends RowDataPacket {
  id: string;
  permission_code: string;
  module_code: string;
  action_code: string;
  description: string | null;
  created_at: Date;
}

export class MysqlRolesRepository implements RolesRepository {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async findById(id: string): Promise<RoleRecord | null> {
    try {
      const [rows] = await this.pool.query<RoleRow[]>(
        "SELECT id, role_code, display_name, description, is_system_role, created_at, updated_at FROM roles WHERE id = ? LIMIT 1",
        [requireId(id)],
      );
      return rows[0] ? mapRole(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async findByCode(roleCode: string): Promise<RoleRecord | null> {
    try {
      const [rows] = await this.pool.query<RoleRow[]>(
        "SELECT id, role_code, display_name, description, is_system_role, created_at, updated_at FROM roles WHERE role_code = ? LIMIT 1",
        [requireCode(roleCode)],
      );
      return rows[0] ? mapRole(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async listRoles(): Promise<RoleRecord[]> {
    try {
      const [rows] = await this.pool.query<RoleRow[]>(
        "SELECT id, role_code, display_name, description, is_system_role, created_at, updated_at FROM roles ORDER BY display_name ASC",
      );
      return rows.map(mapRole);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async listPermissionsForRole(roleCode: string): Promise<PermissionRecord[]> {
    try {
      const [rows] = await this.pool.query<PermissionRow[]>(
        `SELECT p.id, p.permission_code, p.module_code, p.action_code, p.description, p.created_at
         FROM permissions p
         INNER JOIN role_permissions rp ON rp.permission_id = p.id
         INNER JOIN roles r ON r.id = rp.role_id
         WHERE r.role_code = ?
         ORDER BY p.permission_code ASC`,
        [requireCode(roleCode)],
      );
      return rows.map(mapPermission);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }
}

function mapRole(row: RoleRow): RoleRecord {
  return {
    id: row.id,
    roleCode: row.role_code,
    displayName: row.display_name,
    description: row.description,
    isSystemRole: row.is_system_role === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPermission(row: PermissionRow): PermissionRecord {
  return {
    id: row.id,
    permissionCode: row.permission_code,
    moduleCode: row.module_code,
    actionCode: row.action_code,
    description: row.description,
    createdAt: row.created_at,
  };
}
