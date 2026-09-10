'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, CheckCircle2, IndianRupee, Loader2, Printer, RefreshCw, Search, X } from 'lucide-react'
import { supabase, money } from '../../../../lib/supabase'
import styles from './payments.module.css'

const today = () => new Date().toISOString().slice(0, 10)

function paidAmount(student) {
  return (student.fee_payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState([])
  const [search, setSearch] = useState('')
  const [method, setMethod] = useState('all')
  const [date, setDate] = useState('')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ student_id: '', amount: '', paid_on: today(), method: 'cash', receipt_no: '', notes: '' })

  const load = async () => {
    setLoading(true); setError('');
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Please login with your administrator account.'); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profile?.role !== 'admin') { setError('Administrator access is required.'); setLoading(false); return }
    setAuthorized(true)
    const { data, error: qError } = await supabase.from('students').select('id,admission_no,full_name,course,total_fee,fee_payments(id,amount,paid_on,method,receipt_no,notes,created_at)').order('created_at', { ascending: false })
    if (qError) setError(qError.message)
    else {
      const list = data || []
      setStudents(list)
      setPayments(list.flatMap(s => (s.fee_payments || []).map(p => ({ ...p, student: s }))).sort((a, b) => new Date(b.paid_on || b.created_at) - new Date(a.paid_on || a.created_at)))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return payments.filter(p => {
      const matchesText = !q || [p.student.full_name, p.student.admission_no, p.student.course, p.receipt_no, p.method].some(v => String(v || '').toLowerCase().includes(q))
      const matchesMethod = method === 'all' || p.method === method
      const matchesDate = !date || p.paid_on === date
      return matchesText && matchesMethod && matchesDate
    })
  }, [payments, search, method, date])

  const stats = useMemo(() => {
    const total = payments.reduce((n, p) => n + Number(p.amount || 0), 0)
    const todayTotal = payments.filter(p => p.paid_on === today()).reduce((n, p) => n + Number(p.amount || 0), 0)
    const due = students.reduce((n, s) => n + Math.max(Number(s.total_fee || 0) - paidAmount(s), 0), 0)
    return { total, todayTotal, due, count: payments.length }
  }, [payments, students])

  const openPayment = (studentId = '') => {
    setSelected(true)
    setForm({ student_id: studentId, amount: '', paid_on: today(), method: 'cash', receipt_no: '', notes: '' })
    setError(''); setNotice('')
  }

  const selectedStudent = students.find(s => s.id === form.student_id)
  const due = selectedStudent ? Math.max(Number(selectedStudent.total_fee || 0) - paidAmount(selectedStudent), 0) : 0

  const submit = async e => {
    e.preventDefault(); setSaving(true); setError(''); setNotice('')
    const amount = Number(form.amount || 0)
    if (!selectedStudent || amount <= 0) { setError('Select a student and enter a valid payment amount.'); setSaving(false); return }
    if (amount > due) { setError(`Payment cannot exceed the outstanding fee of ${money(due)}.`); setSaving(false); return }
    const payload = { student_id: form.student_id, amount, paid_on: form.paid_on, method: form.method, notes: form.notes }
    if (form.receipt_no.trim()) payload.receipt_no = form.receipt_no.trim()
    const { data: inserted, error: insertError } = await supabase.from('fee_payments').insert(payload).select('id').single()
    if (insertError) setError(insertError.message)
    else if (inserted?.id) window.location.href = `/admin/crm/receipt?id=${inserted.id}`
    setSaving(false)
  }

  if (loading) return <main className={styles.state}><Loader2 className={styles.spin} size={28}/><p>Loading Payments Centre…</p></main>
  if (!authorized) return <main className={styles.state}><AlertCircle size={30}/><h1>Payments Access</h1><p>{error}</p><Link href="/admin/crm">Back to CRM</Link></main>

  return <main className={styles.page}>
    <div className={styles.topbar}><Link href="/admin/crm" className={styles.back}><ArrowLeft size={17}/> Back to CRM</Link><button className={styles.secondary} onClick={load}><RefreshCw size={16}/> Refresh</button></div>
    <header className={styles.header}><div><span className={styles.eyebrow}><IndianRupee size={15}/> CRM Payments</span><h1>Payments Centre</h1><p>Record collections, review payment history and print receipts from one place.</p></div><button className={styles.primary} onClick={() => openPayment()}><IndianRupee size={17}/> Record Payment</button></header>
    {error && <div className={styles.alert}><AlertCircle size={17}/><span>{error}</span><button onClick={() => setError('')}><X size={16}/></button></div>}
    {notice && <div className={styles.success}><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice('')}><X size={16}/></button></div>}
    <section className={styles.stats}><div><IndianRupee/><span>Total Collected</span><strong>{money(stats.total)}</strong></div><div><IndianRupee/><span>Today's Collection</span><strong>{money(stats.todayTotal)}</strong></div><div><IndianRupee/><span>Outstanding</span><strong>{money(stats.due)}</strong></div><div><CheckCircle2/><span>Payments</span><strong>{stats.count}</strong></div></section>
    <section className={styles.toolbar}><div className={styles.search}><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, admission no., receipt…"/></div><select value={method} onChange={e => setMethod(e.target.value)}><option value="all">All methods</option><option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank</option><option value="card">Card</option><option value="other">Other</option></select><input type="date" value={date} onChange={e => setDate(e.target.value)}/></section>
    <section className={styles.table}><div className={styles.tableHead}><span>Date</span><span>Student</span><span>Course</span><span>Receipt</span><span>Method</span><span>Amount</span><span></span></div>{filtered.map(p => <div className={styles.row} key={p.id}><span>{p.paid_on}</span><span><b>{p.student.full_name}</b><small>{p.student.admission_no}</small></span><span>{p.student.course || '—'}</span><span>{p.receipt_no || '—'}</span><span className={styles.method}>{p.method}</span><strong>{money(p.amount)}</strong><Link href={`/admin/crm/receipt?id=${p.id}`} aria-label="Print receipt"><Printer size={17}/></Link></div>)}{!filtered.length && <div className={styles.empty}>No payments match your filters.</div>}</section>

    {selected && <div className={styles.backdrop}><div className={styles.modal}><div className={styles.modalHead}><div><span className={styles.formEyebrow}>Fee Collection</span><h2>Record Payment</h2><p>Save the payment and open its professional receipt automatically.</p></div><button onClick={() => setSelected(false)}><X/></button></div><form onSubmit={submit}><label>Student<select required value={form.student_id} onChange={e => setForm(v => ({ ...v, student_id: e.target.value }))}><option value="">Select student</option>{students.map(s => <option key={s.id} value={s.id}>{s.full_name} · {s.admission_no}</option>)}</select></label>{selectedStudent && <div className={styles.dueBox}><span>Total Fee <b>{money(selectedStudent.total_fee)}</b></span><span>Already Paid <b>{money(paidAmount(selectedStudent))}</b></span><span>Balance Due <b>{money(due)}</b></span></div>}<div className={styles.formGrid}><label>Amount *<input required type="number" min="1" step="0.01" max={due || undefined} value={form.amount} onChange={e => setForm(v => ({ ...v, amount: e.target.value }))} placeholder="0"/></label><label>Payment Date<input required type="date" value={form.paid_on} onChange={e => setForm(v => ({ ...v, paid_on: e.target.value }))}/></label><label>Payment Method<select value={form.method} onChange={e => setForm(v => ({ ...v, method: e.target.value }))}><option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank</option><option value="card">Card</option><option value="other">Other</option></select></label><label>Receipt No. (optional)<input value={form.receipt_no} onChange={e => setForm(v => ({ ...v, receipt_no: e.target.value }))} placeholder="Leave blank if not assigned"/></label><label className={styles.full}>Notes<textarea rows="3" value={form.notes} onChange={e => setForm(v => ({ ...v, notes: e.target.value }))}/></label></div><div className={styles.modalActions}><button type="button" className={styles.secondary} onClick={() => setSelected(false)}>Cancel</button><button className={styles.primary} disabled={saving}>{saving ? 'Saving…' : 'Save & Print Receipt'}</button></div></form></div></div>}
  </main>
}
