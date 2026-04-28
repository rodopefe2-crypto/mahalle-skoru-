'use client'

import { useState, useEffect } from 'react'

interface Mahalle {
  slug: string
  isim: string
}

export function useMahalleler(ilceSlug: string) {
  const [mahalleler, setMahalleler] = useState<Mahalle[]>([])
  const [yukleniyor, setYukleniyor] = useState(false)

  useEffect(() => {
    if (!ilceSlug) {
      setMahalleler([])
      return
    }
    setYukleniyor(true)
    fetch(`/api/mahalle?ilce=${ilceSlug}`)
      .then(r => r.json())
      .then(d => {
        setMahalleler(
          (d.mahalleler || []).map((m: any) => ({ slug: m.slug, isim: m.isim }))
        )
      })
      .catch(() => setMahalleler([]))
      .finally(() => setYukleniyor(false))
  }, [ilceSlug])

  return { mahalleler, yukleniyor }
}
