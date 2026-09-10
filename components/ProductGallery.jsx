'use client'

import { useMemo, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import styles from './ProductGallery.module.css'

export default function ProductGallery({ title, coverUrl, imageUrls = [] }) {
  const images = useMemo(() => {
    const values = [coverUrl, ...(Array.isArray(imageUrls) ? imageUrls : [])]
      .map(value => String(value || '').trim())
      .filter(Boolean)
    return [...new Set(values)]
  }, [coverUrl, imageUrls])

  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(false)
  const current = images[active]

  function move(direction) {
    setActive(index => (index + direction + images.length) % images.length)
  }

  if (!images.length) {
    return <div className={styles.wrap}><div className={styles.main}><BookOpen size={72} /><span>Taleem Tech E-Book</span></div></div>
  }

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.main}>
          <button className={styles.imageButton} onClick={() => setZoom(true)} aria-label="Open product image fullscreen">
            <img src={current} alt={`${title} preview ${active + 1}`} />
          </button>
          <button className={styles.zoom} onClick={() => setZoom(true)} aria-label="Enlarge product image"><Maximize2 size={17} /></button>
          {images.length > 1 && <>
            <button className={`${styles.arrow} ${styles.prev}`} onClick={() => move(-1)} aria-label="Previous product image"><ChevronLeft size={20} /></button>
            <button className={`${styles.arrow} ${styles.next}`} onClick={() => move(1)} aria-label="Next product image"><ChevronRight size={20} /></button>
            <span className={styles.counter}>{active + 1} / {images.length}</span>
          </>}
        </div>
        {images.length > 1 && <div className={styles.thumbs} aria-label="Product image gallery">
          {images.map((image, index) => <button key={`${image}-${index}`} className={`${styles.thumb} ${index === active ? styles.selected : ''}`} onClick={() => setActive(index)} aria-label={`View product image ${index + 1}`} aria-pressed={index === active}>
            <img src={image} alt={`${title} thumbnail ${index + 1}`} />
          </button>)}
        </div>}
      </div>
      {zoom && <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={`${title} image viewer`} onClick={() => setZoom(false)}>
        <button className={styles.close} onClick={() => setZoom(false)} aria-label="Close image viewer"><X size={24} /></button>
        <img src={current} alt={`${title} enlarged preview ${active + 1}`} onClick={e => e.stopPropagation()} />
        {images.length > 1 && <>
          <button className={`${styles.lightboxArrow} ${styles.prev}`} onClick={e => { e.stopPropagation(); move(-1) }} aria-label="Previous product image"><ChevronLeft size={28} /></button>
          <button className={`${styles.lightboxArrow} ${styles.next}`} onClick={e => { e.stopPropagation(); move(1) }} aria-label="Next product image"><ChevronRight size={28} /></button>
        </>}
      </div>}
    </>
  )
}
