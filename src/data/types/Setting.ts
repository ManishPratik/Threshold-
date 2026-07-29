import type { BaseEntity } from './common';

export type SettingValueType = 'string' | 'number' | 'boolean' | 'json';

/**
 * Key-value settings store. The `type` discriminator preserves the intended
 * shape when serialising to JSON for export/import.
 */
export interface Setting extends BaseEntity {
  key: string;
  type: SettingValueType;
  value: string | number | boolean | Record<string, unknown> | unknown[];
}
