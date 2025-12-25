import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
  showTagline?: boolean
}

export default function Logo({ className = '', size = 'medium', showTagline = true }: LogoProps) {
  const dimensions = {
    small: { width: 150, height: 125 },
    medium: { width: 300, height: 250 },
    large: { width: 300, height: 250 },
  }

  const { width, height } = dimensions[size]

  return (
    <Link href="/" className={`inline-block ${className}`}>
      <div className="bg-white/50 backdrop-blur-sm rounded-lg p-2 inline-block">
        <Image
          src="/images/logo.png"
          alt="AnyTrade - Building Trust, One Job at a Time"
          width={width}
          height={height}
          priority
          className="w-auto h-auto max-w-[300px] max-h-[250px]"
        />
      </div>
    </Link>
  )
}
