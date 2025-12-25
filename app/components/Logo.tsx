import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
  showTagline?: boolean
}

export default function Logo({ className = '', size = 'medium', showTagline = true }: LogoProps) {
  const dimensions = {
    small: { width: 180, height: 105 },
    medium: { width: 300, height: 175 },
    large: { width: 450, height: 263 },
  }

  const { width, height } = dimensions[size]

  return (
    <Link href="/" className={`inline-block ${className}`}>
      <Image
        src="/images/logo.png"
        alt="AnyTrade - Building Trust, One Job at a Time"
        width={width}
        height={height}
        priority
        className="w-auto h-auto"
      />
    </Link>
  )
}
