'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, ChevronRight, LogOut, Mail, Package, RefreshCw, ShoppingBag, UserCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './account.module.css'

export default function Account() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [books, setBooks] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function loadAccount(refresh = false) {
    if (refresh) setRefreshing(true)
    setError('')
    const { data: auth, error: authError } = await supabase.auth.getUser()
    const currentUser = auth?.user || null
    setUser(currentUser)
    if (authError || !currentUser) {
      setOrders([])
      setBooks(0)
      setLoading(false)
      setRefreshing(false)
      return
    }
    const { data, error: queryError } = await supabase.from('orders').select('id,status,total,created_at,order_items(title,quantity)').eq('user_id', currentUser.id).order('created_at', { ascending: false })
    if (queryError) setError('We could not load your account summary right now.')
    const list = data || []
    setOrders(list)
    setBooks(list.reduce((sum, order) => sum + (order.order_items || []).reduce((n, item) => n + (Number(item.quantity) || 0), 0), 0))
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { loadAccount() }, [])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const paidOrders = useMemo(() => orders.filter(o => String(o.status).toLowerCase() === 'paid').length, [orders])
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Customer'

  if (loading) return <section className="section"><div className="container"><div className={`empty ${styles.state}`}><Loader2 size={30} className={styles.spin}/><h2>Loading your account</h2><p>Preparing your customer dashboard…</p></div></div></section>

  if (!user) return <section className="section"><div className="container"><div className={`empty ${styles.state}`}><span className={styles.stateIcon}><UserCircle size={32}/></span><span className="eyebrow">CUSTOMER ACCOUNT</span><h2>Welcome to Taleem Tech</h2><p>Sign in to manage your orders, purchased e-books and account access.</p><div className={styles.actions}><Link className="btn primary" href="/login?next=/account">Sign in</Link><Link className="btn" href="/register?next=/account">Create account</Link></div></div></div></section>

  return <section className={`section ${styles.page}`}>
    <div className="container">
      <div className={styles.header}><div><span className="eyebrow">MY ACCOUNT</span><h1>Welcome, {displayName}</h1><p className="muted">Manage your Taleem Tech e-book purchases and account.</p></div><button className={styles.refresh} onClick={() => loadAccount(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? styles.spin : ''}/> {refreshing ? 'Refreshing…' : 'Refresh'}</button></div>
      {error && <div className={`error ${styles.message}`} role="alert"><AlertCircle size={16}/>{error}</div>}

      <div className={styles.profile}><span className={styles.avatar}><UserCircle size={31}/></span><div><span className="eyebrow">ACCOUNT PROFILE</span><b>{displayName}</b><span><Mail size={14}/> {user.email}</span></div><button onClick={logout}><LogOut size={16}/> Logout</button></div>

      <div className={styles.stats}><div><span><ShoppingBag size={18}/></span><b>{orders.length}</b><small>Total orders</small></div><div><span><BookOpen size={18}/></span><b>{books}</b><small>E-books ordered</small></div><div><span><CheckCircle2 size={18}/></span><b>{paidOrders}</b><small>Completed orders</small></div></div>

      <div className={styles.grid}>
        <Link className={styles.actionCard} href="/orders"><span><Package size={21}/></span><div><b>Order History</b><small>View orders, statuses and detailed purchase information.</small></div><ChevronRight size={18}/></Link>
        <Link className={styles.actionCard} href="/library"><span><BookOpen size={21}/></span><div><b>My Library</b><small>Access your paid e-books and secure downloads.</small></div><ChevronRight size={18}/></Link>
        <Link className={styles.actionCard} href="/ebooks"><span><ShoppingBag size={21}/></span><div><b>Browse E-Books</b><small>Explore the latest digital learning collection.</small></div><ChevronRight size={18}/></Link>
      </div>

      <div className={styles.recent}><div className={styles.sectionHead}><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Recent Orders</h2></div><Link href="/orders">View all <ChevronRight size={15}/></Link></div>{orders.length ? orders.slice(0, 3).map(order => <Link className={styles.order} href="/orders" key={order.id}><div><b>Order #{order.id.slice(0, 8)}</b><span>{new Date(order.created_at).toLocaleDateString('en-IN')} · {(order.order_items || []).length} product(s)</span></div><div><strong className={`${styles.status} ${String(order.status).toLowerCase() === 'paid' ? styles.paid : styles.other}`}>{order.status}</strong><b>{money(order.total)}</b></div><ChevronRight size={17}/></Link>) : <div className={styles.noActivity}><ShoppingBag size={25}/><p>No orders yet. Start building your digital library.</p><Link className="btn primary small" href="/ebooks">Shop E-Books</Link></div>}</div>

      <div className={styles.trust}><CheckCircle2 size={18}/><div><b>Secure account access</b><span>Your orders and digital purchases are shown only for your signed-in account.</span></div></div>
    </div>
  </section>
}
