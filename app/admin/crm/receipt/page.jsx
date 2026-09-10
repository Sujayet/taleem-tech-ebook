'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Printer } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { supabase, money } from '../../../../lib/supabase'
import styles from './receipt.module.css'

const centreId = 'NCEBc2503150'
const centreEmail = 'sujayetmd1@gmail.com'
const centrePhone = '9836968835'

export default function ReceiptPage(){
  const params=useSearchParams(), id=params.get('id')
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[payment,setPayment]=useState(null)
  useEffect(()=>{(async()=>{
    const {data:{user}}=await supabase.auth.getUser(); if(!user){setError('Please login as administrator.');setLoading(false);return}
    const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle(); if(profile?.role!=='admin'){setError('Administrator access is required.');setLoading(false);return}
    if(!id){setError('Receipt ID is missing.');setLoading(false);return}
    const {data,error:e}=await supabase.from('fee_payments').select('id,amount,paid_on,method,receipt_no,notes,students(id,admission_no,full_name,course,batch,total_fee,guardian_name)').eq('id',id).single()
    if(e)setError(e.message);else setPayment(data);setLoading(false)
  })()},[id])
  if(loading)return <main className={styles.state}><Loader2 className={styles.spin}/><p>Preparing receipt…</p></main>
  if(error)return <main className={styles.state}><h1>Receipt</h1><p>{error}</p><Link href="/admin/crm">Back to CRM</Link></main>
  const student=payment.students, method={cash:'Cash',upi:'UPI',bank:'Bank Transfer',card:'Card',other:'Other'}[payment.method]||payment.method
  return <main className={styles.wrapper}>
    <div className={styles.screenBar}><Link href="/admin/crm"><ArrowLeft size={16}/> Back to CRM</Link><button onClick={()=>window.print()}><Printer size={16}/> Print / Save PDF</button></div>
    <section className={styles.receipt}>
      <header className={styles.heading}><div className={styles.logo}>TT</div><div><h1>FEE RECEIPT</h1><h2>TALEEM TECH COMPUTER TRAINING CENTRE</h2><h3>AN ISO 9001:2015 CERTIFIED</h3><p>Email: {centreEmail} | Phone: {centrePhone}</p></div><div className={styles.logo}>TT</div></header>
      <div className={styles.info}><div><b>Student Name</b><span>{student.full_name}</span></div><div><b>Student ID</b><span>{student.admission_no}</span></div><div><b>Receipt No.</b><span>{payment.receipt_no||'—'}</span></div><div><b>Receipt Date</b><span>{payment.paid_on}</span></div><div><b>Centre ID</b><span>{centreId}</span></div><div><b>Payment Mode</b><span>{method}</span></div></div>
      <table><thead><tr><th>Sr.</th><th>Particulars / Fee Details</th><th>Amount</th></tr></thead><tbody><tr><td>1</td><td>{student.course ? `${student.course} Fee Payment` : 'Fee Payment'}</td><td>{money(payment.amount)}</td></tr>{payment.notes&&<tr><td></td><td>{payment.notes}</td><td></td></tr>}<tr className={styles.total}><td></td><td>Total Amount</td><td>{money(payment.amount)}</td></tr></tbody></table>
      <div className={styles.amountWords}>Amount Received: <b>{money(payment.amount)}</b></div>
      <div className={styles.signatures}><div><span></span><b>Centre Head Sign</b></div><div><span></span><b>Centre Seal</b></div><div><span></span><b>Parent/Guardian Sign</b></div></div>
      <footer>This is a computer generated fee receipt. Please obtain physical signature and centre seal after printing.</footer>
    </section>
  </main>
}
