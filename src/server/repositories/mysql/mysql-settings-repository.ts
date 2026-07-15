import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

import { getDatabasePool, toDatabaseError } from "../../db";
import type { AppSettingRecord } from "../repository-types";
import type { SettingsRepository } from "../settings-repository";
import { parseJsonValue, requireCode } from "./mysql-helpers";

interface SettingRow extends RowDataPacket {
  id: string;
  setting_group: string;
  setting_key: string;
  value_json: string;
  is_public: 0 | 1;
  updated_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export class MysqlSettingsRepository implements SettingsRepository {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async get(settingGroup: string, settingKey: string): Promise<AppSettingRecord | null> {
    try {
      const [rows] = await this.pool.query<SettingRow[]>(
        `SELECT id, setting_group, setting_key, value_json, is_public, updated_by_user_id,
          created_at, updated_at
         FROM app_settings
         WHERE setting_group = ? AND setting_key = ?
         LIMIT 1`,
        [requireCode(settingGroup), requireCode(settingKey)],
      );
      return rows[0] ? mapSetting(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async listByGroup(settingGroup: string): Promise<AppSettingRecord[]> {
    try {
      const [rows] = await this.pool.query<SettingRow[]>(
        `SELECT id, setting_group, setting_key, value_json, is_public, updated_by_user_id,
          created_at, updated_at
         FROM app_settings
         WHERE setting_group = ?
         ORDER BY setting_key ASC`,
        [requireCode(settingGroup)],
      );
      return rows.map(mapSetting);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }
}

function mapSetting(row: SettingRow): AppSettingRecord {
  return {
    id: row.id,
    settingGroup: row.setting_group,
    settingKey: row.setting_key,
    valueJson: parseJsonValue(row.value_json),
    isPublic: row.is_public === 1,
    updatedByUserId: row.updated_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
