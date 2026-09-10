'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Mail, Phone, ShieldCheck, UserCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import styles from './profile.module.css'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('customer')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser()
      const currentUser = auth?.user || null
      if (!currentUser) {
        window.location.href = '/login?next=/profile'
        return
      }
      setUser(currentUser)
      setName(currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '')
      setPhone(currentUser.user_metadata?.phone || '')
      const { data: profile } = await supabase.from('profiles').select('role,full_name').eq('id', currentUser.id).maybeSingle()
      setRole(profile?.role || 'customer')
      if (!currentUser.user_metadata?.full_name && profile?.full_name) setName(profile.full_name)
      setLoading(false)
    }
    load()
  }, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    const cleanName = name.trim()
    const cleanPhone = phone.trim()
    if (!cleanName) {
      setError('Please enter your full name.')
      setSaving(false)
      return
    }
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: { full_name: cleanName, phone: cleanPhone }
    })
    if (updateError) {
      setError(updateError.message || 'Could not update your profile.')
    } else {
      setUser(data.user || user)
      setMessage('Profile updated successfully.')
    }
    setSaving(false)
  }

  if (loading) return <section className="section"><div className="container"><div className={`empty ${styles.state}`}><Loader2 size={30} className={styles.spin}/><h2>Loading your profile</h2><p>Preparing your account details…</p></div></div></section>

  const displayRole = role === 'admin' ? 'Administrator' : 'Customer'
  const initials = (name || user?.email || 'T').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()

  return <section className={`section ${styles.page}`}>
    <div className="container">
      <Link href="/account" className={styles.back}><ArrowLeft size={16}/> Back to My Account</Link>
      <div className={styles.header}>
        <div><span className="eyebrow">MY PROFILE</span><h1>Your profile</h1><p className="muted">Keep your Taleem Tech account information up to date.</p></div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.card}>
          <div className={styles.avatar}>{initials || <UserCircle size={40}/>}</div>
          <h2>{name || 'Taleem Tech User'}</h2>
          <span className={styles.email}><Mail size={14}/> {user?.email}</span>
          <span className={`${styles.role} ${role === 'admin' ? styles.admin : ''}`}><ShieldCheck size={14}/> {displayRole}</span>
          <div className={styles.note}>Your account role controls which areas of the store you can access.</div>
          {role === 'admin' && <Link href="/admin" className="btn primary full">Open Admin Centre</Link>}
          <Link href="/orders" className="btn full">Order History</Link>
          <Link href="/library" className="btn full">My Library</Link>
        </aside>

        <div className={styles.formCard}>
          <div className={styles.formHead}><div><span className="eyebrow">ACCOUNT DETAILS</span><h2>Personal information</h2><p>Update the name and phone number connected to your account.</p></div></div>
          <form onSubmit={save}>
            <label>Full name<span className={styles.input}><UserCircle size={17}/><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required /></span></label>
            <label>Phone number <span className={styles.optional}>(optional)</span><span className={styles.input}><Phone size={17}/><input value={phone} onChange={e => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="Your phone number" /></span></label>
            <label>Email address <span className={styles.help}>Email is managed by your secure login</span><span className={`${styles.input} ${styles.disabled}`}><Mail size={17}/><input value={user?.email || ''} readOnly aria-readonly="true" /></span></label>
            {error && <div className={styles.error}><AlertCircle size={16}/><span>{error}</span></div>}
            {message && <div className={styles.success}><CheckCircle2 size={16}/><span>{message}</span></div>}
            <button className="btn primary" type="submit" disabled={saving}>{saving ? <><Loader2 size={16} className={styles.spin}/> Saving…</> : 'Save profile'}</button>
          </form>
        </div>
      </div>
    </div>
  </section>
}
