import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
  showTagline?: boolean
}

export default function Logo({ className = '', size = 'medium', showTagline = false }: LogoProps) {
  const sizes = {
    small: { width: 120, height: 40 },
    medium: { width: 200, height: 67 },
    large: { width: 300, height: 100 },
  }

  const { width, height } = sizes[size]

  return (
    <Link href="/" className={`inline-block ${className}`}>
      <Image
        src="/images/logo.png"
        alt="AnyTrade - Building Trust, One Job at a Time"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </Link>
  )
}
