'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AuthStyles from '@/components/AuthStyles'

export default function Login() {
  const [safeNext, setSafeNext] = useState('/library')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next') || '/library'
    if (next.startsWith('/') && !next.startsWith('//')) setSafeNext(next)
  }, [])

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setError(error.message || 'Unable to sign in. Please check your details and try again.')
      setBusy(false)
      return
    }
    window.location.href = safeNext
  }

  return (
    <>
      <AuthStyles />
      <section className="auth authModern">
        <div className="authShell">
          <div className="authIntro">
            <span className="eyebrow">WELCOME BACK</span>
            <h1>Sign in to your Taleem Tech account</h1>
            <p>Access your purchased e-books, orders and personal digital library from one secure account.</p>
            <div className="authTrust">
              <span><ShieldCheck size={17} /> Secure Supabase authentication</span>
              <span><LockKeyhole size={17} /> Your account stays protected</span>
            </div>
          </div>
          <div className="authCard authCardModern">
            <h2>Sign in</h2>
            <p className="authSubtitle">Enter your registered email and password.</p>
            <form onSubmit={submit} noValidate>
              <label>Email address<span className="authInput"><Mail size={17} aria-hidden="true" /><input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} /></span></label>
              <label>Password<span className="authInput"><LockKeyhole size={17} aria-hidden="true" /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={e => setPassword(e.target.value)} /><button type="button" className="passwordToggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
              {error && <div className="error authMessage" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
              <button disabled={busy} className="btn primary full authSubmit" type="submit">{busy ? <><Loader2 size={17} className="spin" /> Signing in…</> : <>Sign in <ArrowRight size={17} /></>}</button>
            </form>
            <div className="authDivider"><span>New to Taleem Tech?</span></div>
            <Link href={`/register?next=${encodeURIComponent(safeNext)}`} className="btn authRegisterLink">Create an account</Link>
          </div>
        </div>
      </section>
    </>
  )
}
