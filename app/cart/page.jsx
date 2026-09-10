'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2, ShieldCheck, BookOpen, Tag } from 'lucide-react'
import { money } from '@/lib/supabase'

export default function Cart() {
  const [cart, setCart] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('tt_cart') || '[]')
      setCart(Array.isArray(stored) ? stored : [])
    } catch {
      setCart([])
    }
    setReady(true)
  }, [])

  function save(next) {
    setCart(next)
    localStorage.setItem('tt_cart', JSON.stringify(next))
    window.dispatchEvent(new Event('storage'))
  }

  function changeQty(id, delta) {
    save(cart.map(item => item.id === id
      ? { ...item, quantity: Math.max(1, (Number(item.quantity) || 1) + delta) }
      : item
    ))
  }

  function remove(id) {
    save(cart.filter(item => item.id !== id))
  }

  function clearCart() {
    save([])
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0),
    [cart]
  )
  const savings = useMemo(
    () => cart.reduce((sum, item) => sum + Math.max(0, ((Number(item.compare_at_price) || 0) - (Number(item.price) || 0)) * (Number(item.quantity) || 0)), 0),
    [cart]
  )

  if (!ready) {
    return <section className="section"><div className="container empty"><ShoppingCart size={34}/><p>Loading your cart…</p></div></section>
  }

  if (!cart.length) {
    return (
      <section className="section cartPage">
        <div className="container">
          <div className="pageTitle">
            <span className="eyebrow">YOUR CART</span>
            <h1>Your shopping cart</h1>
            <p className="muted">Your selected e-books will appear here.</p>
          </div>
          <div className="empty cartEmpty">
            <span className="emptyIcon"><ShoppingCart size={38}/></span>
            <h2>Your cart is empty</h2>
            <p>Explore our digital learning collection and add an e-book when you're ready.</p>
            <Link className="btn primary" href="/ebooks">Browse E-Books <ArrowRight size={17}/></Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section cartPage">
      <div className="container">
        <div className="pageTitle cartHeading">
          <div>
            <span className="eyebrow">YOUR CART</span>
            <h1>Review your order</h1>
            <p className="muted">Digital e-books • Instant access after your order is completed</p>
          </div>
          <button className="textBtn" onClick={clearCart}>Clear cart</button>
        </div>

        <div className="cartLayout">
          <div className="cartItems">
            <div className="cartItemsHeader">
              <b>{cart.reduce((n, x) => n + (Number(x.quantity) || 0), 0)} item(s)</b>
              <span>Digital products</span>
            </div>

            {cart.map(item => (
              <article className="cartItem" key={item.id}>
                <div className="miniCover">
                  {item.cover_url ? <img src={item.cover_url} alt=""/> : <BookOpen size={25}/>} 
                </div>
                <div className="cartInfo">
                  <Link href={`/products/${item.slug || item.id}`}><b>{item.title}</b></Link>
                  <span>Digital e-book</span>
                  <strong>{money(item.price)}</strong>
                </div>
                <div className="qty" aria-label={`Quantity for ${item.title}`}>
                  <button aria-label="Decrease quantity" onClick={() => changeQty(item.id, -1)}><Minus size={15}/></button>
                  <b>{item.quantity}</b>
                  <button aria-label="Increase quantity" onClick={() => changeQty(item.id, 1)}><Plus size={15}/></button>
                </div>
                <div className="cartLineTotal">{money((Number(item.price) || 0) * (Number(item.quantity) || 0))}</div>
                <button className="iconBtn cartRemove" aria-label={`Remove ${item.title}`} onClick={() => remove(item.id)}><Trash2 size={17}/></button>
              </article>
            ))}

            <div className="cartContinue">
              <Link href="/ebooks">← Continue shopping</Link>
            </div>
          </div>

          <aside className="summary cartSummary">
            <h2>Order Summary</h2>
            <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
            {savings > 0 && <div className="saving"><span><Tag size={15}/> You save</span><b>-{money(savings)}</b></div>}
            <div><span>Delivery</span><b>Digital</b></div>
            <hr/>
            <div className="total"><span>Total</span><b>{money(subtotal)}</b></div>
            <Link className="btn primary full" href="/checkout">Continue to Checkout <ArrowRight size={17}/></Link>
            <div className="cartTrust"><ShieldCheck size={18}/><span>Secure account-based access to your purchased e-books.</span></div>
          </aside>
        </div>
      </div>
    </section>
  )
}
