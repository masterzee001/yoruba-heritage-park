import type { AppSettingRecord } from "./repository-types";

export interface SettingsRepository {
  get(settingGroup: string, settingKey: string): Promise<AppSettingRecord | null>;
  listByGroup(settingGroup: string): Promise<AppSettingRecord[]>;
}
