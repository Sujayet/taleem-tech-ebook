'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  BookOpen,
  ShoppingCart,
  User,
  UserPlus,
  LogOut,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('customer')
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)

  async function loadUser() {
    const { data } = await supabase.auth.getUser()
    const currentUser = data?.user || null
    setUser(currentUser)
    if (!currentUser) {
      setRole('customer')
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .maybeSingle()
    setRole(profile?.role || 'customer')
  }

  useEffect(() => {
    loadUser()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    const syncCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('tt_cart') || '[]')
        setCount(cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0))
      } catch {
        setCount(0)
      }
    }

    syncCart()
    window.addEventListener('storage', syncCart)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', syncCart)
    }
  }, [])

  const closeMenu = () => setOpen(false)

  const logout = async () => {
    await supabase.auth.signOut()
    closeMenu()
    window.location.href = '/'
  }

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Account'

  return (
    <header className="header">
      <div className="container nav">
        <Link href="/" className="brand" onClick={closeMenu}>
          <span className="logo"><BookOpen size={20} /></span>
          <span><b>Taleem Tech</b><small>Computer Training Centre</small></span>
        </Link>

        <button className="menu" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className={open ? 'show' : ''}>
          <Link href="/" onClick={closeMenu}>Home</Link>
          <Link href="/ebooks" onClick={closeMenu}>E-Books</Link>
          <Link href="/library" onClick={closeMenu}>My Library</Link>
          <Link href="/orders" onClick={closeMenu}>Orders</Link>
          <Link href="/about" onClick={closeMenu}>About</Link>
          <Link href="/contact" onClick={closeMenu}>Contact</Link>

          <Link href="/cart" className="cart" aria-label={`Shopping cart${count ? ` with ${count} items` : ''}`} onClick={closeMenu}>
            <ShoppingCart size={18} />
            {count > 0 && <i>{count}</i>}
          </Link>

          {user ? (
            <div className="accountActions">
              <Link href="/profile" className="profileNav" onClick={closeMenu} title={`Open ${displayName}'s profile`}>
                <User size={16} />
                <span>Profile</span>
              </Link>
              {role === 'admin' && (
                <Link href="/admin" className="adminNav" onClick={closeMenu} title="Open Admin Centre">
                  <ShieldCheck size={16} />
                  <span>Admin</span>
                </Link>
              )}
              <button className="logout" onClick={logout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="authActions">
              <Link href="/login" className="login" onClick={closeMenu}><User size={16} /> Login</Link>
              <Link href="/register" className="register" onClick={closeMenu}><UserPlus size={16} /> Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
