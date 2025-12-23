'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const slides = [
  {
    src: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=80',
    alt: 'Professional electrician at work',
    title: 'Licensed Electricians'
  },
  {
    src: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1920&q=80',
    alt: 'Professional plumber fixing pipes',
    title: 'Expert Plumbers'
  },
  {
    src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
    alt: 'Construction worker building',
    title: 'Skilled Builders'
  },
  {
    src: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=1920&q=80',
    alt: 'Professional carpenter working',
    title: 'Master Carpenters'
  },
  {
    src: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1920&q=80',
    alt: 'Professional painter painting walls',
    title: 'Professional Painters'
  }
]

export default function BackgroundSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 -z-10">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}
    </div>
  )
}
