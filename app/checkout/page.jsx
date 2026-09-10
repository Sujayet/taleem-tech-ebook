'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck, ShoppingBag, Loader2 } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './checkout.module.css'

export default function Checkout() {
  const [cart, setCart] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const raw = localStorage.getItem('tt_cart') || '[]'
        const parsed = JSON.parse(raw)
        if (mounted) setCart(Array.isArray(parsed) ? parsed.filter(x => x?.id && Number(x?.quantity) > 0) : [])
      } catch {
        if (mounted) setCart([])
      }

      const { data, error: authError } = await supabase.auth.getUser()
      if (mounted) {
        setUser(authError ? null : data.user || null)
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const total = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0), [cart])
  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [cart])

  async function placeOrder() {
    if (busy) return
    setError('')
    if (!user) {
      window.location.href = '/login?next=/checkout'
      return
    }
    if (!cart.length) return

    setBusy(true)
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (sessionError || !token) {
        setError('Your session has expired. Please sign in again before placing the order.')
        setBusy(false)
        return
      }

      const items = cart.map(item => ({
        product_id: item.id,
        quantity: Math.max(1, Number(item.quantity) || 1)
      }))
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!baseUrl) throw new Error('Order service is not configured.')

      const response = await fetch(`${baseUrl}/functions/v1/create-order-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items })
      })

      let body = {}
      try { body = await response.json() } catch {}
      if (!response.ok) throw new Error(body?.error || body?.message || 'We could not create your order. Please try again.')

      const orderId = body?.order?.id
      if (!orderId) throw new Error('The order service returned an incomplete response. Your cart was not cleared.')

      localStorage.removeItem('tt_cart')
      window.dispatchEvent(new Event('storage'))
      window.location.href = `/orders?created=${encodeURIComponent(orderId)}`
    } catch (err) {
      setError(err?.message || 'Something went wrong while creating your order. Please try again.')
      setBusy(false)
    }
  }

  if (loading) return <section className="section"><div className="container"><div className={`empty ${styles.loading}`}><Loader2 className={styles.spin} size={28}/><p>Preparing secure checkout…</p></div></div></section>

  if (!cart.length) return <section className="section"><div className="container"><div className={`empty ${styles.empty}`}><ShoppingBag size={36}/><h2>Your cart is empty</h2><p>Add an e-book to your cart before continuing to checkout.</p><Link className="btn primary" href="/ebooks">Browse E-Books <ArrowRight size={17}/></Link></div></div></section>

  return <section className={`section ${styles.page}`}>
    <div className="container">
      <div className={styles.title}>
        <div><span className="eyebrow">SECURE CHECKOUT</span><h1>Complete your order</h1><p className="muted">Review your digital e-books and confirm the order securely.</p></div>
        <Link className={styles.back} href="/cart">← Back to cart</Link>
      </div>

      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.card}>
            <div className={styles.cardHead}><div><span className={styles.step}>1</span><div><h2>Customer account</h2><p>Your purchase will be linked to this account.</p></div></div><ShieldCheck size={20}/></div>
            {user ? <div className={styles.account}><span className={styles.accountIcon}><Mail size={18}/></span><div><b>{user.email}</b><span>Signed in and ready to order</span></div><CheckCircle2 size={19}/></div> : <div className="notice"><b>Sign in required</b><br/>Sign in or create an account to continue. Your e-books will be available in your digital library after the order is created.<div className={styles.authLinks}><Link className="btn primary" href="/login?next=/checkout">Sign in</Link><Link className="btn" href="/register?next=/checkout">Create account</Link></div></div>}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}><div><span className={styles.step}>2</span><div><h2>Your e-books</h2><p>{itemCount} item{itemCount === 1 ? '' : 's'} in this order</p></div></div><ShoppingBag size={20}/></div>
            <div className={styles.items}>{cart.map(item => <div className={styles.item} key={item.id}><div className={styles.cover}>{item.cover_url ? <img src={item.cover_url} alt="" /> : <ShoppingBag size={22}/>}</div><div className={styles.itemInfo}><b>{item.title}</b><span>Digital e-book · Quantity {item.quantity}</span></div><strong>{money((Number(item.price) || 0) * (Number(item.quantity) || 0))}</strong></div>)}</div>
            <Link href="/cart" className={styles.edit}>Edit cart</Link>
          </div>

          <div className={styles.secure}><LockKeyhole size={18}/><div><b>Secure account-based delivery</b><span>Orders are created for your signed-in account. No physical delivery is required.</span></div></div>
        </main>

        <aside className={styles.summary}>
          <div className={styles.summaryTop}><span className="eyebrow">ORDER SUMMARY</span><h2>Confirm & place order</h2></div>
          <div className={styles.rows}><div><span>Items</span><b>{itemCount}</b></div><div><span>Digital delivery</span><b>Included</b></div></div>
          <hr/>
          <div className={styles.total}><span>Total</span><strong>{money(total)}</strong></div>
          {error && <div className="error" role="alert"><AlertCircle size={16}/><span>{error}</span></div>}
          <button className="btn primary full" disabled={busy || !user} onClick={placeOrder}>{busy ? <><Loader2 size={17} className={styles.spin}/> Creating secure order…</> : <>Place Order <ArrowRight size={17}/></>}</button>
          {!user && <p className={styles.hint}>Sign in above to enable order placement.</p>}
          <p className={styles.paymentNote}>Payment gateway integration can be connected in the next production step. This step creates the secure pending order record only.</p>
        </aside>
      </div>
    </div>
  </section>
}
