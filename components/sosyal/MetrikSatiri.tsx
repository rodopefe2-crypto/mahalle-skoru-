interface MetrikSatiriProps {
  label: string
  value: number
  renk: string
  birim?: string
  maxValue?: number
}

export function MetrikSatiri({ label, value, renk, birim = 'adet', maxValue = 100 }: MetrikSatiriProps) {
  const yuzde = birim === '%' ? value : Math.min((value / maxValue) * 100, 100)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: '#374151', minWidth: 140, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, background: '#f0f2f5', height: 5, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: yuzde + '%',
          background: renk,
          borderRadius: 99,
          transition: 'width 800ms ease-out',
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: renk, minWidth: 40, textAlign: 'right' }}>
        {value}{birim === '%' ? '%' : ''}
        {birim === 'adet' && (
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}> mekan</span>
        )}
      </span>
    </div>
  )
}
