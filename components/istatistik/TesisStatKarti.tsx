interface TesisStatKartiProps {
  ikon:     string
  label:    string
  sayi:     number
  birim:    string
  renk:     string
  acikRenk: string
  animDelay: number
}

export function TesisStatKarti({
  ikon, label, sayi, birim,
  renk, acikRenk, animDelay,
}: TesisStatKartiProps) {
  if (sayi === 0) return null

  return (
    <div style={{
      background:   acikRenk,
      border:       `1px solid ${renk}25`,
      borderRadius: 12,
      padding:      '12px 14px',
      display:      'flex',
      alignItems:   'center',
      gap:          10,
      transition:   'transform 200ms ease, box-shadow 200ms ease',
      animationDelay: animDelay + 'ms',
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLElement
      el.style.transform  = 'translateY(-2px)'
      el.style.boxShadow  = `0 4px 12px ${renk}20`
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLElement
      el.style.transform  = 'none'
      el.style.boxShadow  = 'none'
    }}
    >
      <div style={{
        width:          36,
        height:         36,
        borderRadius:   10,
        background:     renk + '18',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       18,
        flexShrink:     0,
      }}>
        {ikon}
      </div>

      <div style={{flex: 1}}>
        <div style={{
          fontSize:   11,
          color:      '#667781',
          marginBottom: 2,
        }}>
          {label}
        </div>
        <div style={{
          display:    'flex',
          alignItems: 'baseline',
          gap:        4,
        }}>
          <span style={{
            fontSize:   20,
            fontWeight: 900,
            color:      renk,
            lineHeight: 1,
          }}>
            {sayi}
          </span>
          <span style={{
            fontSize: 11,
            color:    '#9ca3af',
          }}>
            {birim}
          </span>
        </div>
      </div>
    </div>
  )
}
