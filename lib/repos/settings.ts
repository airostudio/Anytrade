import { query, queryOne, safeRead } from '../db'
import type { SiteSettingRow } from '../types'

/** Defaults used when a setting has never been written, or the DB is offline. */
export const SETTING_DEFAULTS: Record<string, string> = {
  'site.tagline': 'Reliable tradies. Reasonable prices. No mucking about.',
  'site.phone': '1300 226 987',
  'site.email': 'office@anytrade.com.au',
  'site.abn': '61 428 903 114',
  'billing.platform_fee_rate': '0.075',
  'billing.gst_rate': '0.10',
  'bidding.max_bids_default': '6',
  'bidding.bid_window_days': '14',
  'reviews.auto_publish': 'true',
  'reviews.min_chars': '20',
  'gate.admin_passcode': 'toolbox-1972',
  'gate.homegirls_passcode': 'homegirls-2024',
  'homegirls.intro':
    'A members-only network for the women working in Australian trades — and for clients who would rather book one.',
}

export async function getSetting(key: string): Promise<string> {
  const row = await safeRead(
    () => queryOne<SiteSettingRow>('SELECT * FROM site_settings WHERE key = $1', [key]),
    null
  )
  return row?.value ?? SETTING_DEFAULTS[key] ?? ''
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await safeRead(
    () => query<SiteSettingRow>('SELECT * FROM site_settings ORDER BY "group", key'),
    [] as SiteSettingRow[]
  )
  const merged: Record<string, string> = { ...SETTING_DEFAULTS }
  for (const row of rows) merged[row.key] = row.value
  return merged
}

export async function listSettings(): Promise<SiteSettingRow[]> {
  const rows = await safeRead(
    () => query<SiteSettingRow>('SELECT * FROM site_settings ORDER BY "group", key'),
    [] as SiteSettingRow[]
  )
  if (rows.length) return rows

  // Nothing stored yet — surface the defaults so the admin screen is usable.
  return Object.entries(SETTING_DEFAULTS).map(([key, value]) => ({
    key,
    value,
    label: null,
    group: key.split('.')[0] ?? 'general',
    updated_at: new Date(),
  }))
}

export async function setSetting(key: string, value: string, label?: string): Promise<void> {
  await query(
    `INSERT INTO site_settings (key, value, label, "group", updated_at)
          VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value,
                label = COALESCE(EXCLUDED.label, site_settings.label),
                updated_at = now()`,
    [key, value, label ?? null, key.split('.')[0] ?? 'general']
  )
}
