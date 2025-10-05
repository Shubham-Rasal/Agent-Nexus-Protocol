export function LineArtCenter() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.6" stroke="currentColor" strokeWidth="0.5" className="text-accent">
        {/* Layered circular pattern */}
        <circle cx="100" cy="100" r="60" />
        <circle cx="100" cy="100" r="50" />
        <circle cx="100" cy="100" r="40" />

        {/* Decorative petals */}
        <path d="M100 40 Q120 50, 130 70 Q120 80, 100 70 Q80 80, 70 70 Q80 50, 100 40" />
        <path d="M130 70 Q140 90, 140 110 Q130 120, 120 110 Q120 90, 130 70" />
        <path d="M140 110 Q130 130, 110 140 Q100 130, 110 120 Q130 120, 140 110" />
        <path d="M110 140 Q90 150, 70 140 Q60 130, 70 120 Q90 120, 110 140" />
        <path d="M70 140 Q60 120, 60 100 Q70 90, 80 100 Q80 120, 70 140" />
        <path d="M60 100 Q70 80, 90 70 Q100 80, 90 90 Q70 90, 60 100" />

        {/* Center */}
        <circle cx="100" cy="100" r="20" fill="white" stroke="currentColor" strokeWidth="0.5" />
      </g>
    </svg>
  )
}
