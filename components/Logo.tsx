import Image from 'next/image'
import Link from 'next/link'

/**
 * The AnyTrade logo. On dark surfaces (`tone="light"`) it sits on a small white
 * chip, because the "TRADE" lettering in the artwork is black.
 */
export default function Logo({
  size = 'md',
  href = '/',
  tone = 'dark',
}: {
  size?: 'sm' | 'md' | 'lg'
  href?: string | null
  tone?: 'dark' | 'light'
}) {
  const height = { sm: 'h-8', md: 'h-11', lg: 'h-16' }[size]
  const image = (
    <Image
      src="/images/logo-trimmed.png"
      alt="AnyTrade"
      width={1005}
      height={518}
      priority={size !== 'sm'}
      className={`${height} w-auto`}
    />
  )
  const body =
    tone === 'light' ? <span className="inline-flex rounded-lg bg-white px-2 py-1">{image}</span> : image
  return href ? (
    <Link href={href} aria-label="AnyTrade home" className="inline-flex items-center">
      {body}
    </Link>
  ) : (
    body
  )
}
