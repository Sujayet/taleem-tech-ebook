'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle2, ClipboardList, IndianRupee, Loader2, Plus, RefreshCw, Search, Users, X } from 'lucide-react'
import { supabase, money } from '../../../lib/supabase'
import styles from './crm.module.css'

const emptyStudent = { admission_no: '', full_name: '', guardian_name: '', phone: '', email: '', course: '', batch: '', join_date: new Date().toISOString().slice(0, 10), status: 'active', total_fee: '', notes: '' }
const emptyPayment = { student_id: '', amount: '', paid_on: new Date().toISOString().slice(0, 10), method: 'cash', receipt_no: '', notes: '' }

function paidAmount(student) {
  return (student.fee_payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
}
function dueAmount(student) { return Math.max(Number(student.total_fee || 0) - paidAmount(student), 0) }

export default function CRMPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [students, setStudents] = useState([])
  const [tab, setTab] = useState('students')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [studentForm, setStudentForm] = useState(emptyStudent)
  const [paymentForm, setPaymentForm] = useState(emptyPayment)
  const [showStudent, setShowStudent] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [authorized, setAuthorized] = useState(false)

  const load = async () => {
    setLoading(true); setError(''); setNotice('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Please login with your administrator account.'); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profile?.role !== 'admin') { setError('Administrator access is required.'); setLoading(false); return }
    setAuthorized(true)
    const { data, error: queryError } = await supabase.from('students').select('id,admission_no,full_name,guardian_name,phone,email,course,batch,join_date,status,total_fee,notes,created_at,fee_payments(id,amount,paid_on,method,receipt_no,notes,created_at)').order('created_at', { ascending: false })
    if (queryError) {
      setError(queryError.message.includes('students') || queryError.code === '42P01' ? 'CRM database tables are not installed yet. The Step 10A interface is ready; Step 10B will add the Students and Fee Payments tables.' : queryError.message)
    } else setStudents(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter(s => (status === 'all' || s.status === status) && (!q || [s.admission_no, s.full_name, s.guardian_name, s.phone, s.email, s.course, s.batch].some(v => String(v || '').toLowerCase().includes(q))))
  }, [students, search, status])

  const stats = useMemo(() => {
    const collected = students.reduce((sum, s) => sum + paidAmount(s), 0)
    const total = students.reduce((sum, s) => sum + Number(s.total_fee || 0), 0)
    return { total: students.length, active: students.filter(s => s.status === 'active').length, completed: students.filter(s => s.status === 'completed').length, total, collected, due: Math.max(total - collected, 0) }
  }, [students])

  const payments = useMemo(() => students.flatMap(s => (s.fee_payments || []).map(p => ({ ...p, student: s }))).sort((a, b) => new Date(b.paid_on || b.created_at) - new Date(a.paid_on || a.created_at)), [students])

  const addStudent = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setNotice('')
    const payload = { ...studentForm, total_fee: Number(studentForm.total_fee || 0) }
    const { error: insertError } = await supabase.from('students').insert(payload)
    if (insertError) setError(insertError.message); else { setNotice('Student added successfully.'); setShowStudent(false); setStudentForm(emptyStudent); await load() }
    setSaving(false)
  }

  const addPayment = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setNotice('')
    const amount = Number(paymentForm.amount || 0)
    const student = students.find(s => s.id === paymentForm.student_id)
    if (!student || amount <= 0) { setError('Select a student and enter a valid payment amount.'); setSaving(false); return }
    if (amount > dueAmount(student)) { setError(`Payment cannot exceed the outstanding fee of ${money(dueAmount(student))}.`); setSaving(false); return }
    const { error: insertError } = await supabase.from('fee_payments').insert({ ...paymentForm, amount })
    if (insertError) setError(insertError.message); else { setNotice('Payment recorded successfully.'); setShowPayment(false); setPaymentForm(emptyPayment); await load() }
    setSaving(false)
  }

  if (loading) return <main className={styles.state}><Loader2 className={styles.spin} size={28}/><p>Loading Student & Fees CRM…</p></main>
  if (!authorized) return <main className={styles.state}><AlertCircle size={30}/><h1>CRM Access</h1><p>{error}</p><Link href="/admin">Back to Admin Centre</Link></main>

  return <main className={styles.page}>
    <div className={styles.topbar}><Link href="/admin" className={styles.back}><ArrowLeft size={17}/> Admin Centre</Link><button className={styles.secondary} onClick={load}><RefreshCw size={16}/> Refresh</button></div>
    <header className={styles.header}><div><span className={styles.eyebrow}><ClipboardList size={15}/> Business CRM</span><h1>Student & Fees Management</h1><p>Manage admissions, course fees, collections and outstanding balances from one place.</p></div><div className={styles.actions}><button className={styles.secondary} onClick={() => { setPaymentForm(emptyPayment); setShowPayment(true) }}><IndianRupee size={17}/> Record Payment</button><button className={styles.primary} onClick={() => { setStudentForm(emptyStudent); setShowStudent(true) }}><Plus size={17}/> Add Student</button></div></header>
    {error && <div className={styles.alert}><AlertCircle size={17}/><span>{error}</span><button onClick={() => setError('')}><X size={16}/></button></div>}
    {notice && <div className={styles.success}><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice('')}><X size={16}/></button></div>}

    <section className={styles.stats}>
      <div><Users/><span>Total Students</span><strong>{stats.total}</strong></div><div><CheckCircle2/><span>Active Students</span><strong>{stats.active}</strong></div><div><IndianRupee/><span>Fees Collected</span><strong>{money(stats.collected)}</strong></div><div><IndianRupee/><span>Outstanding</span><strong>{money(stats.due)}</strong></div>
    </section>

    <div className={styles.tabs}><button className={tab === 'students' ? styles.activeTab : ''} onClick={() => setTab('students')}><Users size={16}/> Students ({filtered.length})</button><button className={tab === 'payments' ? styles.activeTab : ''} onClick={() => setTab('payments')}><IndianRupee size={16}/> Payment History ({payments.length})</button></div>

    {tab === 'students' ? <>
      <section className={styles.toolbar}><div className={styles.search}><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, admission no., phone, course…"/></div><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="completed">Completed</option><option value="inactive">Inactive</option></select></section>
      <section className={styles.grid}>{filtered.map(s => { const paid = paidAmount(s); const due = dueAmount(s); return <article className={styles.card} key={s.id}>
        <div className={styles.cardTop}><div className={styles.avatar}>{s.full_name?.slice(0,1).toUpperCase()}</div><div className={styles.identity}><h3>{s.full_name}</h3><p>{s.admission_no} · {s.course || 'Course not set'}</p></div><span className={`${styles.badge} ${styles[s.status]}`}>{s.status}</span></div>
        <div className={styles.contact}><span>{s.phone || 'No phone'}</span><span>{s.batch || 'No batch'}</span></div>
        <div className={styles.feeRow}><div><small>Total Fee</small><b>{money(s.total_fee)}</b></div><div><small>Paid</small><b>{money(paid)}</b></div><div className={due ? styles.due : ''}><small>Due</small><b>{money(due)}</b></div></div>
        <button className={styles.details} onClick={() => setExpanded(expanded === s.id ? null : s.id)}>{expanded === s.id ? 'Hide details' : 'View details'}</button>
        {expanded === s.id && <div className={styles.detailsBox}><p><b>Guardian:</b> {s.guardian_name || '—'}</p><p><b>Email:</b> {s.email || '—'}</p><p><b>Joining date:</b> {s.join_date || '—'}</p><p><b>Notes:</b> {s.notes || '—'}</p><h4>Payment history</h4>{(s.fee_payments || []).length ? s.fee_payments.map(p => <div className={styles.paymentLine} key={p.id}><span>{p.paid_on} · {p.method}</span><b>{money(p.amount)}</b></div>) : <p>No payments recorded yet.</p>}</div>}
      </article> })}</section>
      {!filtered.length && <div className={styles.empty}><BookOpen size={30}/><h3>No students found</h3><p>Add a student or change your search/filter.</p></div>}
    </> : <section className={styles.paymentTable}><div className={styles.tableHead}><span>Date</span><span>Student</span><span>Receipt</span><span>Method</span><span>Amount</span></div>{payments.map(p => <div className={styles.tableRow} key={p.id}><span>{p.paid_on}</span><span><b>{p.student.full_name}</b><small>{p.student.admission_no}</small></span><span>{p.receipt_no || '—'}</span><span>{p.method}</span><strong>{money(p.amount)}</strong></div>)}{!payments.length && <div className={styles.empty}>No payments recorded yet.</div>}</section>}

    {showStudent && <div className={styles.modalBackdrop}><div className={styles.modal}><div className={styles.modalHead}><div><h2>Add Student</h2><p>Create a new student admission record.</p></div><button onClick={() => setShowStudent(false)}><X/></button></div><form onSubmit={addStudent}><div className={styles.formGrid}><label>Admission No.*<input required value={studentForm.admission_no} onChange={e => setStudentForm({...studentForm, admission_no:e.target.value})}/></label><label>Student Name*<input required value={studentForm.full_name} onChange={e => setStudentForm({...studentForm, full_name:e.target.value})}/></label><label>Guardian / Parent<input value={studentForm.guardian_name} onChange={e => setStudentForm({...studentForm, guardian_name:e.target.value})}/></label><label>Mobile<input value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone:e.target.value})}/></label><label>Email<input type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email:e.target.value})}/></label><label>Course<input value={studentForm.course} onChange={e => setStudentForm({...studentForm, course:e.target.value})}/></label><label>Batch<input value={studentForm.batch} onChange={e => setStudentForm({...studentForm, batch:e.target.value})}/></label><label>Joining Date<input type="date" value={studentForm.join_date} onChange={e => setStudentForm({...studentForm, join_date:e.target.value})}/></label><label>Total Course Fee<input type="number" min="0" step="0.01" value={studentForm.total_fee} onChange={e => setStudentForm({...studentForm, total_fee:e.target.value})}/></label><label>Status<select value={studentForm.status} onChange={e => setStudentForm({...studentForm, status:e.target.value})}><option value="active">Active</option><option value="completed">Completed</option><option value="inactive">Inactive</option></select></label><label className={styles.full}>Notes<textarea rows="3" value={studentForm.notes} onChange={e => setStudentForm({...studentForm, notes:e.target.value})}/></label></div><div className={styles.modalActions}><button type="button" className={styles.secondary} onClick={() => setShowStudent(false)}>Cancel</button><button className={styles.primary} disabled={saving}>{saving ? 'Saving…' : 'Create Student'}</button></div></form></div></div>}
    {showPayment && <div className={styles.modalBackdrop}><div className={styles.modal}><div className={styles.modalHead}><div><h2>Record Fee Payment</h2><p>Add a collection entry to a student account.</p></div><button onClick={() => setShowPayment(false)}><X/></button></div><form onSubmit={addPayment}><div className={styles.formGrid}><label className={styles.full}>Student*<select required value={paymentForm.student_id} onChange={e => setPaymentForm({...paymentForm, student_id:e.target.value})}><option value="">Select student</option>{students.filter(s => dueAmount(s) > 0).map(s => <option value={s.id} key={s.id}>{s.admission_no} — {s.full_name} · Due {money(dueAmount(s))}</option>)}</select></label><label>Amount*<input required type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount:e.target.value})}/></label><label>Payment Date<input type="date" value={paymentForm.paid_on} onChange={e => setPaymentForm({...paymentForm, paid_on:e.target.value})}/></label><label>Method<select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method:e.target.value})}><option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank Transfer</option><option value="card">Card</option><option value="other">Other</option></select></label><label>Receipt No.<input value={paymentForm.receipt_no} onChange={e => setPaymentForm({...paymentForm, receipt_no:e.target.value})}/></label><label className={styles.full}>Notes<textarea rows="3" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes:e.target.value})}/></label></div><div className={styles.modalActions}><button type="button" className={styles.secondary} onClick={() => setShowPayment(false)}>Cancel</button><button className={styles.primary} disabled={saving}>{saving ? 'Saving…' : 'Record Payment'}</button></div></form></div></div>}
  </main>
}
