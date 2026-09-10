'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, ChevronDown, Clock3, Loader2, PackageCheck, RefreshCw, ShoppingBag, XCircle } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './orders.module.css'

const statusMeta = {
  paid: { label: 'Paid', tone: 'success', icon: CheckCircle2, text: 'Payment confirmed. Your e-books are available in My Library.' },
  pending: { label: 'Pending', tone: 'pending', icon: Clock3, text: 'Your order is being processed. Please check again shortly.' },
  failed: { label: 'Payment failed', tone: 'danger', icon: XCircle, text: 'This order was not completed. Please place a new order if needed.' },
  canceled: { label: 'Canceled', tone: 'danger', icon: XCircle, text: 'This order has been canceled.' },
}

function getStatus(status) {
  return statusMeta[String(status || '').toLowerCase()] || { label: String(status || 'Processing'), tone: 'pending', icon: Clock3, text: 'Your order is currently being processed.' }
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState('')
  const [createdId, setCreatedId] = useState('')

  async function loadOrders(showRefresh = false) {
    if (showRefresh) setRefreshing(true)
    setError('')
    const { data: auth, error: authError } = await supabase.auth.getUser()
    const currentUser = auth?.user || null
    setUser(currentUser)
    if (authError) setError('We could not verify your account. Please sign in again.')
    if (!currentUser) {
      setOrders([])
      setLoading(false)
      setRefreshing(false)
      return
    }
    const { data, error: queryError } = await supabase
      .from('orders')
      .select('id,email,status,total,currency,created_at,order_items(title,quantity,unit_price)')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
    if (queryError) setError('We could not load your orders right now. Please try again.')
    setOrders(data || [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    loadOrders()
    try {
      const id = new URLSearchParams(window.location.search).get('created')
      if (id) setCreatedId(id)
    } catch {}
  }, [])

  const itemCount = useMemo(() => orders.reduce((sum, order) => sum + (order.order_items || []).reduce((n, item) => n + (Number(item.quantity) || 0), 0), 0), [orders])

  if (loading) return <section className="section"><div className="container"><div className={`empty ${styles.state}`}><Loader2 className={styles.spin} size={30}/><h2>Loading your orders</h2><p>Checking your account order history…</p></div></div></section>

  if (!user) return <section className="section"><div className="container"><div className={`empty ${styles.state}`}><span className={styles.stateIcon}><PackageCheck size={30}/></span><span className="eyebrow">PRIVATE ACCOUNT</span><h2>Sign in to view orders</h2><p>Your order history is securely linked to your Taleem Tech account.</p><Link className="btn primary" href="/login?next=/orders">Sign in <ArrowRight size={17}/></Link></div></div></section>

  return <section className={`section ${styles.page}`}>
    <div className="container">
      <div className={styles.header}>
        <div><span className="eyebrow">ACCOUNT</span><h1>Order History</h1><p className="muted">Track your e-book purchases and access completed orders.</p></div>
        <button className={styles.refresh} onClick={() => loadOrders(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? styles.spin : ''}/> {refreshing ? 'Refreshing…' : 'Refresh'}</button>
      </div>

      {createdId && <div className={styles.successBanner} role="status"><span className={styles.bannerIcon}><CheckCircle2 size={20}/></span><div><b>Order received successfully</b><span>Order #{createdId.slice(0, 8)} has been created. Your order status will appear below.</span></div><button onClick={() => setCreatedId('')} aria-label="Dismiss">×</button></div>}
      {error && <div className={`error ${styles.message}`} role="alert"><AlertCircle size={16}/><span>{error}</span></div>}

      {orders.length ? <>
        <div className={styles.overview}><div><b>{orders.length}</b><span>Orders</span></div><div><b>{itemCount}</b><span>E-books ordered</span></div><div><b>{orders.filter(o => String(o.status).toLowerCase() === 'paid').length}</b><span>Completed</span></div></div>
        <div className={styles.list}>
          {orders.map(order => {
            const meta = getStatus(order.status)
            const Icon = meta.icon
            const isOpen = expanded === order.id
            const items = order.order_items || []
            return <article className={styles.card} key={order.id}>
              <div className={styles.cardTop}>
                <div className={styles.orderIdentity}><span className={styles.orderIcon}><ShoppingBag size={18}/></span><div><b>Order #{order.id.slice(0, 8)}</b><span>{new Date(order.created_at).toLocaleString('en-IN')}</span></div></div>
                <div className={styles.total}><small>Total</small><b>{money(order.total)}</b></div>
              </div>
              <div className={styles.statusRow}><span className={`${styles.status} ${styles[meta.tone]}`}><Icon size={15}/>{meta.label}</span><span className={styles.statusText}>{meta.text}</span></div>
              <div className={styles.itemPreview}>{items.slice(0, 2).map((item, index) => <div key={`${order.id}-${index}`}><BookOpen size={15}/><span>{item.title}</span><b>×{item.quantity || 1}</b></div>)}{items.length > 2 && <span className={styles.more}>+{items.length - 2} more item(s)</span>}</div>
              <div className={styles.actions}><button className={styles.details} onClick={() => setExpanded(isOpen ? '' : order.id)}>{isOpen ? 'Hide details' : 'View details'} <ChevronDown size={16} className={isOpen ? styles.rotated : ''}/></button>{String(order.status).toLowerCase() === 'paid' && <Link className="btn primary small" href="/library">Open My Library <ArrowRight size={15}/></Link>}</div>
              {isOpen && <div className={styles.detailsPanel}><div className={styles.detailHeader}><b>Order details</b><span>{items.length} product(s)</span></div>{items.map((item, index) => <div className={styles.detailItem} key={`${order.id}-detail-${index}`}><div><BookOpen size={16}/><span>{item.title}</span></div><span>{item.quantity || 1} × {money(item.unit_price)}</span><b>{money((Number(item.unit_price) || 0) * (Number(item.quantity) || 0))}</b></div>)}<div className={styles.grand}><span>Order total</span><b>{money(order.total)}</b></div></div>}
            </article>
          })}
        </div>
      </> : <div className={`empty ${styles.empty}`}><span className={styles.stateIcon}><ShoppingBag size={30}/></span><span className="eyebrow">YOUR ORDERS</span><h2>No orders yet</h2><p>When you purchase an e-book, your order and payment status will appear here.</p><Link className="btn primary" href="/ebooks">Shop E-Books <ArrowRight size={17}/></Link></div>}

      <div className={styles.help}><span className={styles.helpIcon}>✓</span><div><b>Need your purchased books?</b><span>Paid orders are connected to your private digital library for secure download access.</span></div><Link href="/library">Go to My Library <ArrowRight size={15}/></Link></div>
    </div>
  </section>
}
