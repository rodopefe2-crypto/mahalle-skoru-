interface SkorBadgeProps {
  skor: number
  boyut?: 'sm' | 'md' | 'lg'
  etiket?: string
  animate?: boolean
}

export default function SkorBadge({
  skor,
  boyut = 'md',
  etiket,
  animate = false,
}: SkorBadgeProps) {
  // Skor rengini belirle
  let bgClass = 'bg-red-50 border-red-200 text-red-700'
  if (skor >= 75) {
    bgClass = 'bg-green-50 border-green-200 text-green-700'
  } else if (skor >= 50) {
    bgClass = 'bg-amber-50 border-amber-200 text-amber-700'
  }

  // Boyutlara göre sınıfları belirle
  let sizeClass = 'w-14 h-14 text-lg'
  if (boyut === 'sm') {
    sizeClass = 'w-10 h-10 text-sm'
  } else if (boyut === 'lg') {
    sizeClass = 'w-20 h-20 text-2xl'
  }

  const animationClass = animate ? 'animate-skorPulse' : ''

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`
          ${sizeClass}
          ${bgClass}
          border-2
          rounded-full
          flex items-center justify-center
          font-bold
          ${animationClass}
          transition-transform duration-200
        `}
      >
        {skor}
      </div>
      {etiket && <div className="text-xs font-medium text-gray-600 text-center">{etiket}</div>}
    </div>
  )
}