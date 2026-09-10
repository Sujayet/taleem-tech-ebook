'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'

export default function CartButton({ product }) {
  const [added, setAdded] = useState(false)

  function add() {
    try {
      const cart = JSON.parse(localStorage.getItem('tt_cart') || '[]')
      const index = cart.findIndex(item => item.id === product.id)
      if (index >= 0) {
        cart[index] = { ...cart[index], quantity: (Number(cart[index].quantity) || 1) + 1 }
      } else {
        cart.push({
          id: product.id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          compare_at_price: product.compare_at_price,
          cover_url: product.cover_url,
          quantity: 1
        })
      }
      localStorage.setItem('tt_cart', JSON.stringify(cart))
      setAdded(true)
      window.dispatchEvent(new Event('storage'))
      setTimeout(() => setAdded(false), 1300)
    } catch {
      setAdded(false)
    }
  }

  return <button className="btn primary" onClick={add}>{added ? <><Check size={18}/> Added</> : <><ShoppingCart size={18}/> Add to Cart</>}</button>
}
