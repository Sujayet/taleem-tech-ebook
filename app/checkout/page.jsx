'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck, ShoppingBag, Loader2, CreditCard } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './checkout.module.css'

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Could not load the secure payment gateway. Please try again.'))
    document.body.appendChild(script)
  })
}

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

  async function startPayment() {
    if (busy) return
    setError('')
    if (!user) { window.location.href = '/login?next=/checkout'; return }
    if (!cart.length) return
    setBusy(true)
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (sessionError || !token) throw new Error('Your session has expired. Please sign in again before payment.')
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!baseUrl) throw new Error('Payment service is not configured.')

      const items = cart.map(item => ({ product_id: item.id, quantity: Math.max(1, Number(item.quantity) || 1) }))
      const createResponse = await fetch(`${baseUrl}/functions/v1/create-order-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items })
      })
      const createdBody = await createResponse.json().catch(() => ({}))
      if (!createResponse.ok) throw new Error(createdBody?.error || 'We could not create your order.')
      const orderId = createdBody?.order?.id
      if (!orderId) throw new Error('The order service returned an incomplete order.')

      await loadRazorpay()
      const paymentResponse = await fetch(`${baseUrl}/functions/v1/create-payment-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_id: orderId })
      })
      const paymentBody = await paymentResponse.json().catch(() => ({}))
      if (!paymentResponse.ok) throw new Error(paymentBody?.error || 'Payment gateway is not configured yet.')

      const options = {
        key: paymentBody.key_id,
        amount: paymentBody.amount,
        currency: paymentBody.currency || 'INR',
        name: 'Taleem Tech',
        description: `${itemCount} digital product${itemCount === 1 ? '' : 's'}`,
        order_id: paymentBody.gateway_order_id,
        prefill: { email: user.email || '' },
        theme: { color: '#173b75' },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch(`${baseUrl}/functions/v1/verify-razorpay-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ order_id: orderId, ...response })
            })
            const verifyBody = await verifyResponse.json().catch(() => ({}))
            if (!verifyResponse.ok) throw new Error(verifyBody?.error || 'Payment verification failed.')
            localStorage.removeItem('tt_cart')
            window.dispatchEvent(new Event('storage'))
            window.location.href = `/orders?created=${encodeURIComponent(orderId)}`
          } catch (verificationError) {
            setError(verificationError?.message || 'Payment was received but verification failed. Please contact support with your order ID.')
            setBusy(false)
          }
        }
      }
      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', (response) => {
        setError(response?.error?.description || 'Payment failed. Your order remains pending and no download access has been granted.')
        setBusy(false)
      })
      razorpay.open()
    } catch (err) {
      setError(err?.message || 'Something went wrong while starting payment.')
      setBusy(false)
    }
  }

  if (loading) return <section className="section"><div className="container"><div className={`empty ${styles.loading}`}><Loader2 className={styles.spin} size={28}/><p>Preparing secure checkout…</p></div></div></section>
  if (!cart.length) return <section className="section"><div className="container"><div className={`empty ${styles.empty}`}><ShoppingBag size={36}/><h2>Your cart is empty</h2><p>Add a digital product to your cart before continuing to checkout.</p><Link className="btn primary" href="/ebooks">Browse Digital Products <ArrowRight size={17}/></Link></div></div></section>

  return <section className={`section ${styles.page}`}>
    <div className="container">
      <div className={styles.title}>
        <div><span className="eyebrow">SECURE CHECKOUT</span><h1>Complete your order</h1><p className="muted">Review your digital products and pay securely.</p></div>
        <Link className={styles.back} href="/cart">← Back to cart</Link>
      </div>
      <div className={styles.layout}>
        <main className={styles.main}>
          <div className={styles.card}>
            <div className={styles.cardHead}><div><span className={styles.step}>1</span><div><h2>Customer account</h2><p>Your purchase will be linked to this account.</p></div></div><ShieldCheck size={20}/></div>
            {user ? <div className={styles.account}><span className={styles.accountIcon}><Mail size={18}/></span><div><b>{user.email}</b><span>Signed in and ready to pay</span></div><CheckCircle2 size={19}/></div> : <div className="notice"><b>Sign in required</b><br/>Sign in or create an account to continue.<div className={styles.authLinks}><Link className="btn primary" href="/login?next=/checkout">Sign in</Link><Link className="btn" href="/register?next=/checkout">Create account</Link></div></div>}
          </div>
          <div className={styles.card}>
            <div className={styles.cardHead}><div><span className={styles.step}>2</span><div><h2>Your digital products</h2><p>{itemCount} item{itemCount === 1 ? '' : 's'} in this order</p></div></div><ShoppingBag size={20}/></div>
            <div className={styles.items}>{cart.map(item => <div className={styles.item} key={item.id}><div className={styles.cover}>{item.cover_url ? <img src={item.cover_url} alt="" /> : <ShoppingBag size={22}/>}</div><div className={styles.itemInfo}><b>{item.title}</b><span>Digital product · Quantity {item.quantity}</span></div><strong>{money((Number(item.price) || 0) * (Number(item.quantity) || 0))}</strong></div>)}</div>
            <Link href="/cart" className={styles.edit}>Edit cart</Link>
          </div>
          <div className={styles.secure}><LockKeyhole size={18}/><div><b>Secure digital delivery</b><span>Your payment is processed securely. Download access is granted only after verified payment.</span></div></div>
        </main>
        <aside className={styles.summary}>
          <div className={styles.summaryTop}><span className="eyebrow">ORDER SUMMARY</span><h2>Pay securely</h2></div>
          <div className={styles.rows}><div><span>Items</span><b>{itemCount}</b></div><div><span>Digital delivery</span><b>Included</b></div><div><span>Payment</span><b>Razorpay</b></div></div>
          <hr/>
          <div className={styles.total}><span>Total</span><strong>{money(total)}</strong></div>
          {error && <div className="error" role="alert"><AlertCircle size={16}/><span>{error}</span></div>}
          <button className="btn primary full" disabled={busy || !user} onClick={startPayment}>{busy ? <><Loader2 size={17} className={styles.spin}/> Opening secure payment…</> : <><CreditCard size={17}/> Pay {money(total)} <ArrowRight size={17}/></>}</button>
          {!user && <p className={styles.hint}>Sign in above to enable payment.</p>}
          <p className={styles.paymentNote}>Secure payment via Razorpay. Your digital access is activated only after server-side payment verification.</p>
        </aside>
      </div>
    </div>
  </section>
}
