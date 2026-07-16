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

interface RoleCountRow extends RowDataPacket {
  role_code: string;
  assigned_count: number;
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

  async countUsersByRole(): Promise<Record<string, number>> {
    try {
      const [rows] = await this.pool.query<RoleCountRow[]>(
        `SELECT r.role_code, COUNT(u.id) AS assigned_count
         FROM roles r
         LEFT JOIN user_roles ur ON ur.role_id = r.id
         LEFT JOIN users u ON u.id = ur.user_id AND u.archived_at IS NULL
         GROUP BY r.role_code`,
      );
      return Object.fromEntries(
        rows.map((row) => [row.role_code, Number(row.assigned_count) || 0]),
      );
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

  async listRolesForUser(userId: string): Promise<RoleRecord[]> {
    try {
      const [rows] = await this.pool.query<RoleRow[]>(
        `SELECT r.id, r.role_code, r.display_name, r.description, r.is_system_role, r.created_at, r.updated_at
         FROM roles r
         INNER JOIN user_roles ur ON ur.role_id = r.id
         WHERE ur.user_id = ?
         ORDER BY r.display_name ASC`,
        [requireId(userId)],
      );
      return rows.map(mapRole);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async listPermissionsForUser(userId: string): Promise<PermissionRecord[]> {
    try {
      const [rows] = await this.pool.query<PermissionRow[]>(
        `SELECT DISTINCT p.id, p.permission_code, p.module_code, p.action_code, p.description, p.created_at
         FROM permissions p
         INNER JOIN role_permissions rp ON rp.permission_id = p.id
         INNER JOIN user_roles ur ON ur.role_id = rp.role_id
         WHERE ur.user_id = ?
         ORDER BY p.permission_code ASC`,
        [requireId(userId)],
      );
      return rows.map(mapPermission);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async setUserRoles(userId: string, roleCodes: string[], assignedByUserId: string): Promise<void> {
    const safeRoleCodes = [...new Set(roleCodes.map(requireCode))];
    if (!safeRoleCodes.length) throw new Error("At least one role is required.");
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [roles] = await connection.query<RoleRow[]>(
        `SELECT id, role_code, display_name, description, is_system_role, created_at, updated_at
         FROM roles
         WHERE role_code IN (?)`,
        [safeRoleCodes],
      );
      if (roles.length !== safeRoleCodes.length)
        throw new Error("One or more roles were not found.");
      await connection.query("DELETE FROM user_roles WHERE user_id = ?", [requireId(userId)]);
      for (const role of roles) {
        await connection.query(
          `INSERT INTO user_roles (user_id, role_id, assigned_by_user_id)
           VALUES (?, ?, ?)`,
          [requireId(userId), role.id, requireId(assignedByUserId)],
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw toDatabaseError(error);
    } finally {
      connection.release();
    }
  }

  async permissionExists(permissionCode: string): Promise<boolean> {
    try {
      const [rows] = await this.pool.query<PermissionRow[]>(
        "SELECT id, permission_code, module_code, action_code, description, created_at FROM permissions WHERE permission_code = ? LIMIT 1",
        [requireCode(permissionCode)],
      );
      return rows.length > 0;
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
