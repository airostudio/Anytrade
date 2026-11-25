'use client'

import type { JobDraft } from './post-job-shared'
import { usePostJob } from './PostJobProvider'

/** Any button that opens the Post-a-Job dialog, optionally prefilled. */
export default function PostJobButton({
  draft,
  step,
  className,
  children,
}: {
  draft?: Partial<JobDraft>
  step?: 1 | 2 | 3
  className?: string
  children: React.ReactNode
}) {
  const { open } = usePostJob()
  return (
    <button type="button" className={className} onClick={() => open(draft, step ? { step } : undefined)}>
      {children}
    </button>
  )
}
