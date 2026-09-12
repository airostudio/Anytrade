'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { Panel } from '@/components/ui'
import { applyToHomegirls, postToNoticeboard } from '@/app/actions/homegirls'

const CATEGORIES = [
  { value: 'noticeboard', label: 'Noticeboard' },
  { value: 'advice', label: 'Advice / question' },
  { value: 'tools', label: 'Tools & gear' },
  { value: 'jobs', label: 'Work going' },
  { value: 'events', label: 'Meet-up' },
]

export default function JoinForms({
  canApply,
  defaults,
}: {
  canApply: boolean
  defaults: { intro: string; mentorAvailable: boolean; seekingMentor: boolean }
}) {
  const [applyState, applyAction] = useFormState(applyToHomegirls, {})
  const [postState, postAction] = useFormState(postToNoticeboard, {})

  return (
    <div className="space-y-8">
      {canApply ? (
        <Panel className="p-7">
          <h2 className="mb-4 border-b-[3px] border-oxide pb-2 font-sign text-xl font-bold uppercase tracking-wide">
            Membership application
          </h2>
          <form action={applyAction} className="space-y-4">
            <FormMessage error={applyState.error} success={applyState.success} />

            <div>
              <label className="label" htmlFor="intro">
                Introduce yourself
              </label>
              <textarea
                id="intro"
                name="intro"
                rows={5}
                required
                minLength={30}
                defaultValue={defaults.intro}
                className="field"
                placeholder="What you do, how long you've been at it, and what you're after from the network."
              />
              <p className="mt-1 text-xs text-ink-mute">
                This appears on your card in the members directory.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2.5 border-[3px] border-ink bg-canvas px-3 py-2.5 text-sm has-[:checked]:bg-mustard">
                <input
                  type="checkbox"
                  name="mentorAvailable"
                  defaultChecked={defaults.mentorAvailable}
                  className="h-4 w-4 accent-oxide"
                />
                I&apos;m happy to mentor
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 border-[3px] border-ink bg-canvas px-3 py-2.5 text-sm has-[:checked]:bg-mustard">
                <input
                  type="checkbox"
                  name="seekingMentor"
                  defaultChecked={defaults.seekingMentor}
                  className="h-4 w-4 accent-oxide"
                />
                I&apos;m looking for a mentor
              </label>
            </div>

            <SubmitButton className="btn-oxide w-full" pendingLabel="Sending…">
              Submit application
            </SubmitButton>
          </form>
        </Panel>
      ) : null}

      <Panel className="p-7">
        <h2 className="mb-4 border-b-[3px] border-oxide pb-2 font-sign text-xl font-bold uppercase tracking-wide">
          Post to the noticeboard
        </h2>
        <form action={postAction} className="space-y-4">
          <FormMessage error={postState.error} success={postState.success} />

          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input id="title" name="title" required minLength={4} className="field" />
          </div>

          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <select id="category" name="category" className="field">
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="body">
              What do you want to say?
            </label>
            <textarea id="body" name="body" rows={6} required minLength={15} className="field" />
          </div>

          <SubmitButton className="btn-primary w-full" pendingLabel="Posting…">
            Post it
          </SubmitButton>
        </form>
      </Panel>
    </div>
  )
}
