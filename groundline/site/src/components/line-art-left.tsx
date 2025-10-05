export function LineArtLeft() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.6" stroke="currentColor" strokeWidth="0.5" className="text-accent">
        {/* Decorative curved lines radiating from center */}
        <path d="M100 100 Q80 60, 60 40" />
        <path d="M100 100 Q70 70, 40 60" />
        <path d="M100 100 Q60 80, 40 80" />
        <path d="M100 100 Q60 90, 40 100" />
        <path d="M100 100 Q60 110, 40 120" />
        <path d="M100 100 Q70 130, 40 140" />
        <path d="M100 100 Q80 140, 60 160" />

        <path d="M100 100 Q120 60, 140 40" />
        <path d="M100 100 Q130 70, 160 60" />
        <path d="M100 100 Q140 80, 160 80" />
        <path d="M100 100 Q140 90, 160 100" />
        <path d="M100 100 Q140 110, 160 120" />
        <path d="M100 100 Q130 130, 160 140" />
        <path d="M100 100 Q120 140, 140 160" />

        {/* Center circle */}
        <circle cx="100" cy="100" r="15" fill="white" stroke="currentColor" strokeWidth="0.5" />
      </g>
    </svg>
  )
}
