const ETIKET_RENKLERI: Record<string, { bg: string; text: string }> = {
  "Genç & Sosyal":    { bg: '#dcf8c6', text: '#075e54' },
  "Aile Dostu":       { bg: '#dbeafe', text: '#1d4ed8' },
  "Hareketli":        { bg: '#fef3c7', text: '#92400e' },
  "Akşamları Canlı":  { bg: '#fce7f3', text: '#9d174d' },
  "Kentsel":          { bg: '#e0e7ff', text: '#3730a3' },
  "Aktif":            { bg: '#d1fae5', text: '#065f46' },
  "Ticari":           { bg: '#fef9c3', text: '#713f12' },
  "Sakin":            { bg: '#f0fdf4', text: '#14532d' },
  "Dengeli":          { bg: '#f3f4f6', text: '#374151' },
  "Aile Odaklı":      { bg: '#eff6ff', text: '#1e40af' },
  "Gündüz Hareketli": { bg: '#fff7ed', text: '#9a3412' },
}

export function YasamTarziEtiketi({ etiket }: { etiket: string }) {
  const stil = ETIKET_RENKLERI[etiket] || { bg: '#f0f2f5', text: '#374151' }
  return (
    <span style={{
      background: stil.bg,
      color: stil.text,
      borderRadius: 99,
      padding: '5px 14px',
      fontSize: 12,
      fontWeight: 600,
      display: 'inline-block',
    }}>
      {etiket}
    </span>
  )
}
