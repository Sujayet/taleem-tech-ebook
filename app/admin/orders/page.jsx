'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, ChevronDown, Clock3, Mail, PackageCheck, RefreshCw, Search, ShieldCheck, ShoppingBag, UserRound, XCircle } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './orders.module.css'

const statusMeta = {
  paid: { label: 'Paid', tone: 'paid', icon: CheckCircle2 },
  pending: { label: 'Pending', tone: 'pending', icon: Clock3 },
  failed: { label: 'Failed', tone: 'failed', icon: XCircle },
  canceled: { label: 'Canceled', tone: 'failed', icon: XCircle },
}

function getStatus(value) {
  return statusMeta[String(value || '').toLowerCase()] || { label: String(value || 'Processing'), tone: 'pending', icon: Clock3 }
}

function customerKey(order) {
  return order.user_id || order.email || 'unknown'
}

export default function AdminOrders() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [view, setView] = useState('orders')
  const [expanded, setExpanded] = useState('')

  async function loadData(refresh = false) {
    if (refresh) setRefreshing(true)
    setError('')
    const { data: auth, error: authError } = await supabase.auth.getUser()
    const currentUser = auth?.user || null
    setUser(currentUser)
    if (authError || !currentUser) {
      window.location.href = '/login?next=/admin/orders'
      return
    }

    const { data: p, error: profileError } = await supabase.from('profiles').select('full_name,role').eq('id', currentUser.id).single()
    if (profileError || p?.role !== 'admin') {
      setProfile(p || null)
      setError('Admin access required.')
      setLoading(false)
      setRefreshing(false)
      return
    }
    setProfile(p)

    const { data, error: orderError } = await supabase
      .from('orders')
      .select('id,user_id,email,status,total,currency,created_at,order_items(title,quantity,unit_price)')
      .order('created_at', { ascending: false })
    if (orderError) setError(orderError.message || 'We could not load the order centre.')
    setOrders(data || [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { loadData() }, [])

  const filteredOrders = useMemo(() => orders.filter(order => {
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || [order.email, order.id, order.user_id, ...(order.order_items || []).map(item => item.title)].some(value => String(value || '').toLowerCase().includes(q))
    const matchesStatus = status === 'all' || String(order.status || '').toLowerCase() === status
    return matchesSearch && matchesStatus
  }), [orders, search, status])

  const customers = useMemo(() => {
    const map = new Map()
    orders.forEach(order => {
      const key = customerKey(order)
      const current = map.get(key) || { key, user_id: order.user_id, email: order.email || 'Email unavailable', orders: 0, paidOrders: 0, spend: 0, books: 0, lastOrder: order.created_at }
      current.orders += 1
      current.books += (order.order_items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      if (String(order.status || '').toLowerCase() === 'paid') {
        current.paidOrders += 1
        current.spend += Number(order.total) || 0
      }
      if (new Date(order.created_at) > new Date(current.lastOrder)) current.lastOrder = order.created_at
      if (!current.email || current.email === 'Email unavailable') current.email = order.email || current.email
      map.set(key, current)
    })
    return Array.from(map.values()).sort((a, b) => new Date(b.lastOrder) - new Date(a.lastOrder))
  }, [orders])

  const visibleCustomers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter(customer => !q || [customer.email, customer.user_id].some(value => String(value || '').toLowerCase().includes(q)))
  }, [customers, search])

  const paidCount = orders.filter(o => String(o.status).toLowerCase() === 'paid').length
  const pendingCount = orders.filter(o => String(o.status).toLowerCase() === 'pending').length
  const revenue = orders.filter(o => String(o.status).toLowerCase() === 'paid').reduce((sum, o) => sum + (Number(o.total) || 0), 0)

  if (loading) return <section className="section"><div className="container"><div className={`empty ${styles.state}`}><RefreshCw size={30} className={styles.spin}/><h2>Loading order centre</h2><p>Verifying administrator access and preparing customer data…</p></div></div></section>

  if (error === 'Admin access required.') return <section className="section"><div className="container"><div className={`empty ${styles.state}`}><span className={styles.stateIcon}><ShieldCheck size={31}/></span><span className="eyebrow">RESTRICTED AREA</span><h2>Administrator access required</h2><p>This area is available only to accounts with the admin role.</p><Link className="btn primary" href="/">Back to Store</Link></div></div></section>

  return <section className={`section ${styles.page}`}>
    <div className="container">
      <div className={styles.header}>
        <div><span className="eyebrow">ADMIN CENTRE</span><h1>Orders & Customers</h1><p className="muted">Review purchases, payment status and your customer base from one place.</p></div>
        <div className={styles.headerActions}><Link className={styles.back} href="/admin">← E-Book Management</Link><button className={styles.refresh} onClick={() => loadData(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? styles.spin : ''}/> {refreshing ? 'Refreshing…' : 'Refresh'}</button></div>
      </div>

      {error && <div className={`error ${styles.message}`} role="alert"><AlertCircle size={16}/><span>{error}</span></div>}

      <div className={styles.stats}>
        <div><span><ShoppingBag size={19}/></span><div><b>{orders.length}</b><small>Total orders</small></div></div>
        <div><span><CheckCircle2 size={19}/></span><div><b>{paidCount}</b><small>Paid orders</small></div></div>
        <div><span><Clock3 size={19}/></span><div><b>{pendingCount}</b><small>Pending</small></div></div>
        <div><span><UserRound size={19}/></span><div><b>{customers.length}</b><small>Customers</small></div></div>
      </div>

      <div className={styles.revenue}><div><span className="eyebrow">PAID REVENUE</span><b>{money(revenue)}</b></div><div><span className="eyebrow">CUSTOMER ORDERS</span><b>{orders.length ? Math.round(orders.length / Math.max(customers.length, 1) * 10) / 10 : 0} <small>avg. per customer</small></b></div></div>

      <div className={styles.tabs} role="tablist"><button className={view === 'orders' ? styles.activeTab : ''} onClick={() => setView('orders')}><ShoppingBag size={16}/> Orders <span>{orders.length}</span></button><button className={view === 'customers' ? styles.activeTab : ''} onClick={() => setView('customers')}><UserRound size={16}/> Customers <span>{customers.length}</span></button></div>

      <div className={styles.toolbar}><label className={styles.search}><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder={view === 'orders' ? 'Search order, email or e-book…' : 'Search customer email…'} aria-label="Search" /></label>{view === 'orders' && <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter order status"><option value="all">All statuses</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="canceled">Canceled</option></select>}</div>

      {view === 'orders' ? <div className={styles.list}>{filteredOrders.length ? filteredOrders.map(order => {
        const meta = getStatus(order.status); const Icon = meta.icon; const open = expanded === order.id; const items = order.order_items || []
        return <article className={styles.orderCard} key={order.id}>
          <div className={styles.orderTop}><div className={styles.identity}><span className={styles.icon}><ShoppingBag size={17}/></span><div><b>Order #{order.id.slice(0, 8)}</b><span>{new Date(order.created_at).toLocaleString('en-IN')}</span></div></div><div className={styles.amount}><small>Total</small><b>{money(order.total)}</b></div></div>
          <div className={styles.orderMeta}><span className={`${styles.status} ${styles[meta.tone]}`}><Icon size={14}/>{meta.label}</span><a href={`mailto:${order.email || ''}`}><Mail size={14}/> {order.email || 'Email unavailable'}</a></div>
          <div className={styles.itemLine}>{items.slice(0, 2).map((item, index) => <span key={`${order.id}-${index}`}><BookOpen size={14}/>{item.title} ×{item.quantity || 1}</span>)}{items.length > 2 && <em>+{items.length - 2} more</em>}</div>
          <button className={styles.details} onClick={() => setExpanded(open ? '' : order.id)}>{open ? 'Hide order details' : 'View order details'} <ChevronDown size={16} className={open ? styles.rotated : ''}/></button>
          {open && <div className={styles.detailPanel}><div className={styles.detailHead}><b>Purchased items</b><span>{items.length} product(s)</span></div>{items.map((item, index) => <div className={styles.detailItem} key={`${order.id}-item-${index}`}><span><BookOpen size={15}/>{item.title}</span><span>{item.quantity || 1} × {money(item.unit_price)}</span><b>{money((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}</b></div>)}<div className={styles.grand}><span>Order total</span><b>{money(order.total)}</b></div></div>}
        </article>
      }) : <div className={`empty ${styles.empty}`}><PackageCheck size={30}/><h2>No orders found</h2><p>Try a different search or status filter.</p></div>}</div> : <div className={styles.customerGrid}>{visibleCustomers.length ? visibleCustomers.map(customer => <article className={styles.customerCard} key={customer.key}><div className={styles.customerTop}><span className={styles.avatar}><UserRound size={20}/></span><div><b>{customer.email}</b><span>{customer.user_id ? `Customer ID · ${customer.user_id.slice(0, 8)}` : 'Guest / legacy customer record'}</span></div></div><div className={styles.customerStats}><div><b>{customer.orders}</b><span>Orders</span></div><div><b>{customer.paidOrders}</b><span>Paid</span></div><div><b>{customer.books}</b><span>Books</span></div><div><b>{money(customer.spend)}</b><span>Paid spend</span></div></div><div className={styles.customerFoot}><span>Last order · {new Date(customer.lastOrder).toLocaleDateString('en-IN')}</span><a href={`mailto:${customer.email}`}><Mail size={14}/> Contact</a></div></article>) : <div className={`empty ${styles.empty}`}><UserRound size={30}/><h2>No customers found</h2><p>Customers appear here after an order is created.</p></div>}</div>}

      <div className={styles.security}><ShieldCheck size={18}/><div><b>Admin-only customer data</b><span>Order and customer records are loaded only after the signed-in account passes the admin-role check. Supabase RLS should also enforce administrator-only access to these tables.</span></div><Link href="/profile">My Profile <ArrowRight size={14}/></Link></div>
    </div>
  </section>
}
