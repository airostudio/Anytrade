'use client'

import { useState } from 'react'
import { CalendarDays, Home, Megaphone, Sprout, UserPlus } from 'lucide-react'
import { NOTICE_BOARD } from '@/lib/homegirls-network'
import { usePostJob } from '@/components/home/PostJobProvider'
import { btnCopper } from '@/components/home/ui'
import { LeafPair, LeafSprig } from './LeafSprig'
import MentorshipModal from './MentorshipModal'

const KIND_ICON = { 'New member': UserPlus, Mentorship: CalendarDays, Workshop: Megaphone } as const

export default function NetworkSidebar() {
  const { open } = usePostJob()
  const [mentorship, setMentorship] = useState(false)

  return (
    <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-1">
      <section
        id="mentorship"
        aria-labelledby="mentor-title"
        className="overflow-hidden rounded-2xl border border-hg-line bg-white shadow-card"
      >
        <div className="relative flex h-36 items-end justify-center overflow-hidden bg-hg-sage-tint">
          <LeafSprig className="absolute -left-3 bottom-0 h-44 w-24 text-hg-sage/50" />
          <LeafSprig className="absolute -right-3 bottom-0 h-44 w-24 -scale-x-100 text-hg-sage/50" />
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white text-hg-sage-deep shadow-card">
            <Sprout className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
          </span>
        </div>
        <div className="p-5">
          <h2 id="mentor-title" className="font-heritage text-2xl font-semibold tracking-tight">
            Support &amp; Mentorship
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-hg-slate">
            Connecting experienced women tradies and mentors with emerging female apprentices across
            Australia.
          </p>
          <button type="button" className={`${btnCopper} mt-5 w-full`} onClick={() => setMentorship(true)}>
            Join the Program
          </button>
        </div>
      </section>

      <section
        aria-labelledby="owner-title"
        className="rounded-2xl border border-hg-line bg-white p-5 shadow-card"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-hg-sage-tint text-hg-sage-deep">
          <Home className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h2 id="owner-title" className="mt-4 font-heritage text-2xl font-semibold tracking-tight">
          Homeowner Information
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-hg-slate">
          When posting any job on AnyTrade, you can specifically request a member of The Homegirls
          Network.
        </p>
        <button
          type="button"
          className={`${btnCopper} mt-5 w-full`}
          onClick={() => open({ preferHomegirl: true })}
        >
          Post a Job Now
        </button>
      </section>

      <section
        aria-labelledby="notice-title"
        className="relative overflow-hidden rounded-2xl border border-hg-line bg-hg-cream p-5"
      >
        <LeafPair className="pointer-events-none absolute -right-5 -top-5 h-28 w-28 text-hg-sage/25" />
        <h2 id="notice-title" className="relative font-heritage text-2xl font-semibold tracking-tight">
          Community Notice Board
        </h2>
        <p className="relative mt-1 text-sm font-bold uppercase tracking-[0.12em] text-hg-sage-deep">
          Recent updates
        </p>
        <ul className="relative mt-3 divide-y divide-hg-line">
          {NOTICE_BOARD.map((n) => {
            const Icon = KIND_ICON[n.kind]
            return (
              <li key={n.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-hg-sage-deep">
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <p className="text-[15px] leading-snug">
                  <span className="font-semibold">{n.text}</span>
                  <span className="text-hg-slate"> — {n.detail}</span>
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      {mentorship ? <MentorshipModal onClose={() => setMentorship(false)} /> : null}
    </div>
  )
}
