'use client'

import { useMemo, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './ProductGallery.module.css'

export default function ProductGallery({ title, coverUrl, imageUrls = [] }) {
  const images = useMemo(() => {
    const values = [coverUrl, ...(Array.isArray(imageUrls) ? imageUrls : [])]
      .map(value => String(value || '').trim())
      .filter(Boolean)
    return [...new Set(values)]
  }, [coverUrl, imageUrls])

  const [active, setActive] = useState(0)
  const current = images[active]

  function move(direction) {
    setActive(index => (index + direction + images.length) % images.length)
  }

  if (!images.length) {
    return <div className={styles.wrap}><div className={styles.main}><BookOpen size={72} /><span>Taleem Tech E-Book</span></div></div>
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.main}>
        <img src={current} alt={`${title} preview ${active + 1}`} />
        {images.length > 1 && <>
          <button className={`${styles.arrow} ${styles.prev}`} onClick={() => move(-1)} aria-label="Previous product image"><ChevronLeft size={20} /></button>
          <button className={`${styles.arrow} ${styles.next}`} onClick={() => move(1)} aria-label="Next product image"><ChevronRight size={20} /></button>
          <span className={styles.counter}>{active + 1} / {images.length}</span>
        </>}
      </div>
      {images.length > 1 && <div className={styles.thumbs} aria-label="Product image gallery">
        {images.map((image, index) => <button key={`${image}-${index}`} className={`${styles.thumb} ${index === active ? styles.selected : ''}`} onClick={() => setActive(index)} aria-label={`View product image ${index + 1}`} aria-pressed={index === active}>
          <img src={image} alt="" />
        </button>)}
      </div>}
    </div>
  )
}
