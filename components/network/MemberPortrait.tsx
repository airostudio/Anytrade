import { LeafPair } from './LeafSprig'
import type { NetworkMember } from '@/lib/homegirls-network'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Portrait for a member. A real consented photo is framed with object-top so
 * heads and eyes are never cropped; without one, a botanical monogram is drawn.
 */
export default function MemberPortrait({
  member,
  className = 'aspect-[4/5]',
}: {
  member: NetworkMember
  className?: string
}) {
  if (member.photoUrl) {
    return (
      <div className={`overflow-hidden bg-hg-sage-tint ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- member photos come from arbitrary hosts */}
        <img
          src={member.photoUrl}
          alt={`Portrait of ${member.name}, ${member.tradeLabel}`}
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
      </div>
    )
  }
  return (
    <div
      role="img"
      aria-label={`${member.name}, ${member.tradeLabel}. No photo yet.`}
      className={`relative flex items-center justify-center overflow-hidden bg-hg-sage-tint ${className}`}
    >
      <LeafPair className="absolute -bottom-4 -right-4 h-36 w-36 text-hg-sage/40" />
      <LeafPair className="absolute -left-6 -top-2 h-24 w-24 -rotate-90 text-hg-sage/25" />
      <span className="relative font-heritage text-5xl font-semibold text-hg-sage-deep">
        {initials(member.name)}
      </span>
    </div>
  )
}
