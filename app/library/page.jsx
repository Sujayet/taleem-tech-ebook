'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, Download, Lock, RefreshCw, ShoppingBag, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import styles from './library.module.css'

export default function Library() {
  const [items, setItems] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState('')

  async function loadLibrary() {
    setError('')
    const { data: auth, error: authError } = await supabase.auth.getUser()
    const currentUser = auth?.user || null
    setUser(currentUser)
    if (authError || !currentUser) {
      setItems([])
      setLoading(false)
      return
    }
    const { data, error: queryError } = await supabase.from('orders').select('id,status,created_at,order_items(product_id,title,unit_price,quantity)').eq('user_id', currentUser.id).eq('status', 'paid').order('created_at', { ascending: false })
    if (queryError) setError('We could not load your library right now. Please try again.')
    const flat = (data || []).flatMap(order => (order.order_items || []).map(item => ({ ...item, order_id: order.id, purchased_at: order.created_at })))
    setItems(flat)
    setLoading(false)
  }

  useEffect(() => { loadLibrary() }, [])
  const totalBooks = useMemo(() => items.length, [items])

  async function download(item) {
    const key = `${item.order_id}:${item.product_id}`
    if (downloading) return
    setDownloading(key); setError('')
    try {
      const { data, error: sessionError } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (sessionError || !token) throw new Error('Your session has expired. Please sign in again.')
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!baseUrl) throw new Error('Download service is not configured.')
      const response = await fetch(`${baseUrl}/functions/v1/download-ebook`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: item.product_id, order_id: item.order_id }) })
      let body = {}
      try { body = await response.json() } catch {}
      if (!response.ok || !body?.url) throw new Error(body?.error || 'This e-book is not available for download yet.')
      window.location.href = body.url
    } catch (err) { setError(err?.message || 'Download failed. Please try again.') }
    finally { setDownloading('') }
  }

  if (loading) return <section className="section"><div className="container"><div className={`empty ${styles.state}`}><Loader2 className={styles.spin} size={30}/><h2>Loading your library</h2><p>Checking your secure purchases…</p></div></div></section>
  if (!user) return <section className="section"><div className="container"><div className={`empty ${styles.state}`}><span className={styles.stateIcon}><Lock size={30}/></span><span className="eyebrow">PRIVATE LIBRARY</span><h2>Sign in to access your e-books</h2><p>Your purchased digital books are securely linked to your Taleem Tech account.</p><div className={styles.actions}><Link className="btn primary" href="/login?next=/library">Sign in</Link><Link className="btn" href="/register?next=/library">Create account</Link></div></div></div></section>

  return <section className={`section ${styles.page}`}><div className="container">
    <div className={styles.header}><div><span className="eyebrow">MY LIBRARY</span><h1>Your E-Books</h1><p className="muted">Your paid digital purchases, ready when you need them.</p></div><button className={styles.refresh} onClick={loadLibrary}><RefreshCw size={16}/> Refresh</button></div>
    <div className={styles.stats}><div><span className={styles.statIcon}><BookOpen size={18}/></span><div><b>{totalBooks}</b><small>Purchased e-books</small></div></div><div><span className={styles.statIcon}><CheckCircle2 size={18}/></span><div><b>Secure</b><small>Account-based access</small></div></div></div>
    {error && <div className={`error ${styles.message}`} role="alert"><AlertCircle size={16}/><span>{error}</span></div>}
    {items.length ? <div className={styles.grid}>{items.map(item => { const key = `${item.order_id}:${item.product_id}`; const busy = downloading === key; return <article className={styles.card} key={key}><div className={styles.cover}><BookOpen size={34}/><span>DIGITAL E-BOOK</span></div><div className={styles.body}><span className={styles.type}>PURCHASED</span><h2>{item.title}</h2><p>Quantity {item.quantity || 1} · Purchased {new Date(item.purchased_at).toLocaleDateString('en-IN')}</p><div className={styles.footer}><span>{item.unit_price ? `₹${Number(item.unit_price).toLocaleString('en-IN')}` : 'Purchased'}</span><button className="btn primary small" disabled={busy} onClick={() => download(item)}>{busy ? <><Loader2 size={15} className={styles.spin}/> Preparing…</> : <><Download size={15}/> Download</>}</button></div></div></article> })}</div> : <div className={`empty ${styles.empty}`}><span className={styles.stateIcon}><ShoppingBag size={30}/></span><span className="eyebrow">YOUR COLLECTION</span><h2>Your library is empty</h2><p>Once a paid order is completed, your e-books will appear here with secure download access.</p><Link className="btn primary" href="/ebooks">Browse E-Books</Link></div>}
    <div className={styles.help}><span className={styles.shield}>✓</span><div><b>Secure digital delivery</b><span>Download links are generated by the protected service and your library is limited to your own paid purchases.</span></div></div>
  </div></section>
}
