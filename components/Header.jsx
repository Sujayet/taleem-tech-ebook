'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, ShoppingCart, User, UserPlus, LogOut, Menu, X, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import styles from './Header.module.css'

export default function Header() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('customer')
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)

  async function loadUser() {
    const { data } = await supabase.auth.getUser()
    const currentUser = data?.user || null
    setUser(currentUser)
    if (!currentUser) return setRole('customer')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).maybeSingle()
    setRole(profile?.role || 'customer')
  }

  useEffect(() => {
    loadUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadUser())
    const syncCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('tt_cart') || '[]')
        setCount(cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0))
      } catch { setCount(0) }
    }
    syncCart()
    window.addEventListener('storage', syncCart)
    return () => { subscription.unsubscribe(); window.removeEventListener('storage', syncCart) }
  }, [])

  const closeMenu = () => setOpen(false)
  const logout = async () => { await supabase.auth.signOut(); closeMenu(); window.location.href = '/' }

  return (
    <header className={styles.header}>
      <div className={styles.nav}>
        <Link href="/" className={styles.brand} onClick={closeMenu}>
          <span className={styles.logo}><BookOpen size={20} /></span>
          <span className={styles.brandText}><b>Taleem Tech</b><small>Digital Learning Store</small></span>
        </Link>

        <button className={styles.menu} aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`${styles.navLinks} ${open ? styles.open : ''}`}>
          <Link href="/" onClick={closeMenu}>Home</Link>
          <Link href="/ebooks" onClick={closeMenu}>E-Books</Link>
          <Link href="/about" onClick={closeMenu}>About</Link>
          <Link href="/contact" onClick={closeMenu}>Contact</Link>
          <Link href="/library" onClick={closeMenu}>My Library</Link>
          <Link href="/orders" onClick={closeMenu}>Orders</Link>
          <Link href="/cart" className={styles.cart} aria-label={`Shopping cart${count ? ` with ${count} items` : ''}`} onClick={closeMenu}>
            <ShoppingCart size={18} /> Cart
            {count > 0 && <i className={styles.count}>{count}</i>}
          </Link>
          <div className={styles.actions}>
            {user ? <>
              <Link href="/profile" className={styles.login} onClick={closeMenu}><User size={15} /> Profile</Link>
              {role === 'admin' && <Link href="/admin" className={styles.admin} onClick={closeMenu}><ShieldCheck size={15} /> Admin</Link>}
              <button className={styles.logout} onClick={logout}><LogOut size={15} /> Logout</button>
            </> : <>
              <Link href="/login" className={styles.login} onClick={closeMenu}><User size={15} /> Login</Link>
              <Link href="/register" className={styles.register} onClick={closeMenu}><UserPlus size={15} /> Register</Link>
            </>}
          </div>
        </nav>
      </div>
    </header>
  )
}
