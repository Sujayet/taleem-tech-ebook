'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Register() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMsg('')

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.')
      setBusy(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim(), phone: phone.trim() } }
    })

    if (error) {
      setError(error.message || 'Unable to create your account. Please try again.')
      setBusy(false)
      return
    }

    if (data.session) {
      window.location.href = '/library'
      return
    }

    setMsg('Account created successfully. Please check your email to confirm your account, then sign in.')
    setBusy(false)
  }

  return (
    <section className="auth authModern">
      <div className="authShell">
        <div className="authIntro">
          <span className="eyebrow">CREATE ACCOUNT</span>
          <h1>Join Taleem Tech</h1>
          <p>Create one account to keep your e-book purchases, orders and digital library together.</p>
          <div className="authChecklist">
            <span><CheckCircle2 size={17} /> Access purchased e-books</span>
            <span><CheckCircle2 size={17} /> Track your orders</span>
            <span><CheckCircle2 size={17} /> Manage your customer account</span>
          </div>
        </div>

        <div className="authCard authCardModern">
          <h2>Create your account</h2>
          <p className="authSubtitle">It only takes a minute to get started.</p>

          <form onSubmit={submit} noValidate>
            <label>
              Full name
              <span className="authInput">
                <UserRound size={17} aria-hidden="true" />
                <input type="text" autoComplete="name" placeholder="Your full name" required value={name} onChange={e => setName(e.target.value)} />
              </span>
            </label>

            <label>
              Phone number <span className="optional">(optional)</span>
              <span className="authInput">
                <Phone size={17} aria-hidden="true" />
                <input type="tel" inputMode="tel" autoComplete="tel" placeholder="Your phone number" value={phone} onChange={e => setPhone(e.target.value)} />
              </span>
            </label>

            <label>
              Email address
              <span className="authInput">
                <Mail size={17} aria-hidden="true" />
                <input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </span>
            </label>

            <label>
              Password
              <span className="authInput">
                <LockKeyhole size={17} aria-hidden="true" />
                <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 6 characters" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="passwordToggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {error && <div className="error authMessage" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
            {msg && <div className="success authMessage" role="status"><CheckCircle2 size={16} /><span>{msg}</span></div>}

            <button disabled={busy} className="btn primary full authSubmit" type="submit">
              {busy ? <><Loader2 size={17} className="spin" /> Creating account…</> : <>Create account <ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="authDivider"><span>Already registered?</span></div>
          <Link href="/login" className="btn authRegisterLink">Sign in instead</Link>
        </div>
      </div>
    </section>
  )
}
