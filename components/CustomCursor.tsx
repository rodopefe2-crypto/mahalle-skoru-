'use client'

import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Touch device'larda cursor'u gizle
    if (window.matchMedia('(hover: none)').matches) return

    const dot  = dotRef.current!
    const ring = ringRef.current!

    let mouseX = 0, mouseY = 0
    let ringX  = 0, ringY  = 0

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      dot.style.left  = mouseX - 4  + 'px'
      dot.style.top   = mouseY - 4  + 'px'
    })

    // Ring lag efekti
    function animate() {
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      ring.style.left = ringX - 16 + 'px'
      ring.style.top  = ringY - 16 + 'px'
      requestAnimationFrame(animate)
    }
    animate()

    // Hover efektleri
    document.querySelectorAll('a, button, [data-cursor-grow]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        ring.style.width   = '52px'
        ring.style.height  = '52px'
        ring.style.opacity = '0.5'
        dot.style.opacity  = '0'
      })
      el.addEventListener('mouseleave', () => {
        ring.style.width   = '32px'
        ring.style.height  = '32px'
        ring.style.opacity = '1'
        dot.style.opacity  = '1'
      })
    })
  }, [])

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  />
      <div ref={ringRef} className="cursor-ring" />
    </>
  )
}
