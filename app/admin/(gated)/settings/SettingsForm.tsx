'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { Panel } from '@/components/ui'
import { adminSaveSettings } from '@/app/actions/admin'
import type { SiteSettingRow } from '@/lib/types'

export default function SettingsForm({
  groups,
  groupLabels,
  secretKeys,
}: {
  groups: Record<string, SiteSettingRow[]>
  groupLabels: Record<string, string>
  secretKeys: string[]
}) {
  const [state, action] = useFormState(adminSaveSettings, {})
  const secrets = new Set(secretKeys)

  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state.error} success={state.success} />

      {Object.entries(groups).map(([group, settings]) => (
        <Panel key={group} className="p-5">
          <h2 className="mb-4 border-b-[3px] border-safety pb-2 font-sign text-lg font-bold uppercase tracking-wide">
            {groupLabels[group] ?? group}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {settings.map((setting) => {
              const isSecret = secrets.has(setting.key)
              const isLong = setting.value.length > 70
              return (
                <div key={setting.key} className={isLong ? 'sm:col-span-2' : ''}>
                  <label className="label" htmlFor={setting.key}>
                    {setting.label ?? humanise(setting.key)}
                  </label>
                  {isLong ? (
                    <textarea
                      id={setting.key}
                      name={`setting:${setting.key}`}
                      defaultValue={setting.value}
                      rows={3}
                      className="field"
                    />
                  ) : (
                    <input
                      id={setting.key}
                      name={`setting:${setting.key}`}
                      type={isSecret ? 'text' : 'text'}
                      defaultValue={setting.value}
                      className={`field ${isSecret ? 'font-mono' : ''}`}
                      autoComplete="off"
                    />
                  )}
                  <p className="mt-1 font-mono text-[11px] text-ink-mute">{setting.key}</p>
                </div>
              )
            })}
          </div>
        </Panel>
      ))}

      <SubmitButton className="btn-primary" pendingLabel="Saving…">
        Save all settings
      </SubmitButton>
    </form>
  )
}

function humanise(key: string): string {
  const tail = key.split('.').slice(1).join(' ')
  return tail.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}
