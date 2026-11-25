'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import PostJobModal from './PostJobModal'
import { EMPTY_DRAFT, type JobDraft } from './post-job-shared'

interface OpenOptions {
  /** Start on this step; defaults to the first incomplete one. */
  step?: 1 | 2 | 3
}

interface PostJobApi {
  open: (draft?: Partial<JobDraft>, options?: OpenOptions) => void
}

const Ctx = createContext<PostJobApi | null>(null)

export function usePostJob(): PostJobApi {
  const api = useContext(Ctx)
  if (!api) throw new Error('usePostJob must be used inside <PostJobProvider>')
  return api
}

/** Holds the "Post a job" dialog so any button on the page can open it, prefilled. */
export default function PostJobProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ draft: JobDraft; step: 1 | 2 | 3; nonce: number } | null>(null)

  const open = useCallback((draft?: Partial<JobDraft>, options?: OpenOptions) => {
    const merged: JobDraft = { ...EMPTY_DRAFT, ...draft }
    const hasWhere = Boolean(merged.suburb && /^\d{4}$/.test(merged.postcode))
    const step = options?.step ?? (merged.category && hasWhere ? 2 : 1)
    setState((prev) => ({ draft: merged, step, nonce: (prev?.nonce ?? 0) + 1 }))
  }, [])

  const api = useMemo(() => ({ open }), [open])

  return (
    <Ctx.Provider value={api}>
      {children}
      {state ? (
        <PostJobModal
          key={state.nonce}
          initial={state.draft}
          initialStep={state.step}
          onClose={() => setState(null)}
        />
      ) : null}
    </Ctx.Provider>
  )
}
