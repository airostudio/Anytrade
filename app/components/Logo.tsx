import Link from 'next/link'

interface LogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
  showTagline?: boolean
}

export default function Logo({ className = '', size = 'medium', showTagline = true }: LogoProps) {
  const dimensions = {
    small: { width: 180, height: 60, scale: 0.6 },
    medium: { width: 300, height: 100, scale: 1 },
    large: { width: 450, height: 150, scale: 1.5 },
  }

  const { width, height, scale } = dimensions[size]

  return (
    <Link href="/" className={`inline-block ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 1200 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* House outline */}
        <g transform="translate(0, 0)">
          {/* Roof */}
          <path
            d="M 150 120 L 350 50 L 550 120 L 550 100 L 580 100 L 580 60 L 620 60 L 620 140 L 150 140 Z"
            fill="#FF9800"
          />
          {/* Chimney */}
          <rect x="540" y="40" width="60" height="80" fill="#FF9800" />

          {/* Base/foundation */}
          <path
            d="M 120 140 L 300 200 L 350 180"
            stroke="#FF9800"
            strokeWidth="20"
            fill="none"
          />
        </g>

        {/* ANY text */}
        <text
          x="180"
          y="340"
          fontFamily="Arial, sans-serif"
          fontSize="160"
          fontWeight="900"
          fill="#1E3A5F"
        >
          ANY
        </text>

        {/* TRADE text */}
        <text
          x="560"
          y="340"
          fontFamily="Arial, sans-serif"
          fontSize="160"
          fontWeight="900"
          fill="#FF9800"
        >
          TRADE
        </text>

        {/* Tagline */}
        {showTagline && (
          <>
            <text
              x="560"
              y="380"
              fontFamily="Arial, sans-serif"
              fontSize="32"
              fontWeight="600"
              fill="#FF9800"
            >
              BUILDING TRUST,
            </text>
            <text
              x="850"
              y="380"
              fontFamily="Arial, sans-serif"
              fontSize="32"
              fontWeight="400"
              fill="#1E3A5F"
            >
              ONE JOB AT A TIME
            </text>
          </>
        )}

        {/* Curved swoosh at bottom */}
        <path
          d="M 180 350 Q 400 380 650 340 Q 800 320 950 360"
          stroke="#FF9800"
          strokeWidth="15"
          fill="none"
        />
      </svg>
    </Link>
  )
}
