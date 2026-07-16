import type { AppSettingRecord } from "./repository-types";

export interface SettingsRepository {
  get(settingGroup: string, settingKey: string): Promise<AppSettingRecord | null>;
  listByGroup(settingGroup: string): Promise<AppSettingRecord[]>;
  listAll(): Promise<AppSettingRecord[]>;
  upsert(input: {
    readonly settingGroup: string;
    readonly settingKey: string;
    readonly valueJson: unknown;
    readonly isPublic?: boolean;
    readonly updatedByUserId: string;
  }): Promise<AppSettingRecord>;
}
