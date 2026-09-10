'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, CheckCircle2, FileText, IndianRupee, Loader2, MapPin, Phone, Printer, UserRound, Wallet, Mail } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { supabase, money } from '../../../../lib/supabase'
import styles from './receipt.module.css'

const centreId = 'NCEBc2503150'
const centreEmail = 'sujayetmd1@gmail.com'
const centrePhone = '9836968835'

function amountInWords(value){
  const n=Math.round(Number(value||0));
  if(n===0)return 'Zero Rupees Only'
  const ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  const two=x=>x<20?ones[x]:`${tens[Math.floor(x/10)]}${x%10?' '+ones[x%10]:''}`
  const part=(x,unit)=>x?`${x<100?two(x):`${ones[Math.floor(x/100)]} Hundred${x%100?' '+two(x%100):''}`} ${unit} `:''
  let r=''
  if(n>=10000000)r+=part(Math.floor(n/10000000),'Crore')
  if(n%10000000>=100000)r+=part(Math.floor((n%10000000)/100000),'Lakh')
  if(n%100000>=1000)r+=part(Math.floor((n%100000)/1000),'Thousand')
  if(n%1000)r+=part(n%1000,'')
  return `${r.trim()} Rupees Only`
}

function formatDate(value){
  if(!value)return '—'
  const d=new Date(`${value}T00:00:00`)
  return d.toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'})
}

function ReceiptContent(){
  const params=useSearchParams(), id=params.get('id')
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[payment,setPayment]=useState(null)
  useEffect(()=>{(async()=>{
    const {data:{user}}=await supabase.auth.getUser(); if(!user){setError('Please login as administrator.');setLoading(false);return}
    const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle(); if(profile?.role!=='admin'){setError('Administrator access is required.');setLoading(false);return}
    if(!id){setError('Receipt ID is missing.');setLoading(false);return}
    const {data,error:e}=await supabase.from('fee_payments').select('id,amount,paid_on,method,receipt_no,notes,students(id,admission_no,full_name,course,batch,total_fee,guardian_name,join_date,admission_fee,phone,email,address)').eq('id',id).single()
    if(e)setError(e.message);else setPayment(data);setLoading(false)
  })()},[id])
  if(loading)return <main className={styles.state}><Loader2 className={styles.spin}/><p>Preparing receipt…</p></main>
  if(error)return <main className={styles.state}><h1>Receipt</h1><p>{error}</p><Link href="/admin/crm">Back to CRM</Link></main>

  const student=payment.students||{}
  const method={cash:'Cash',upi:'UPI',bank:'Bank Transfer',card:'Card',other:'Other'}[payment.method]||payment.method
  const paid=Number(payment.amount||0)
  const totalFee=Number(student.total_fee||0)
  const admissionFee=Number(student.admission_fee||0)
  const balance=Math.max(totalFee-paid,0)
  return <main className={styles.wrapper}>
    <div className={styles.screenBar}><Link href="/admin/crm"><ArrowLeft size={17}/> Back to CRM</Link><button onClick={()=>window.print()}><Printer size={17}/> Print / Save PDF</button></div>
    <section className={styles.receipt}>
      <header className={styles.header}>
        <img className={styles.brandLogo} src="/taleem-tech-logo.svg" alt="Taleem Tech logo"/>
        <div className={styles.brand}>
          <div className={styles.brandName}><span>TALEEM</span> <em>TECH</em></div>
          <h1>COMPUTER TRAINING CENTRE</h1>
          <div className={styles.iso}>AN ISO 9001:2015 CERTIFIED</div>
          <div className={styles.tagline}>Learn&nbsp; | &nbsp;Practice&nbsp; | &nbsp;Grow&nbsp; | &nbsp;Build Your Future</div>
        </div>
        <div className={styles.contact}><div><Phone size={13}/> {centrePhone}</div><div><Mail size={13}/> {centreEmail}</div><div><MapPin size={13}/> Kolkata, West Bengal</div><div><span className={styles.webIcon}>●</span> www.taleemtech.in</div></div>
      </header>

      <div className={styles.rule}/>
      <div className={styles.receiptTitle}><span><FileText size={24}/> FEE RECEIPT</span></div>
      <p className={styles.thankYou}>THANK YOU FOR CHOOSING TALEEM TECH</p>

      <div className={styles.metaStrip}>
        <div><FileText/><span>Receipt No.<b>{payment.receipt_no||'—'}</b></span></div>
        <div><CalendarDays/><span>Receipt Date<b>{formatDate(payment.paid_on)}</b></span></div>
        <div><Wallet/><span>Payment Mode<b>{method}</b></span></div>
      </div>

      <div className={styles.studentPanel}>
        <div className={styles.studentColumn}>
          <div><UserRound/><span>Student Name<b>{student.full_name||'—'}</b></span></div>
          <div><FileText/><span>Student ID<b>{student.admission_no||'—'}</b></span></div>
          <div><CheckCircle2/><span>Course Name<b>{student.course||'—'}</b></span></div>
        </div>
        <div className={styles.studentColumn}>
          <div><MapPin/><span>Centre ID<b>{centreId}</b></span></div>
          <div><CalendarDays/><span>Admission Date<b>{formatDate(student.join_date)}</b></span></div>
          <div><UserRound/><span>Guardian Name<b>{student.guardian_name||'—'}</b></span></div>
        </div>
      </div>

      <table className={styles.feeTable}><thead><tr><th>Sr.</th><th>Particulars / Fee Details</th><th>Amount (₹)</th></tr></thead><tbody>
        <tr><td>1</td><td>{student.course ? `${student.course} Fee Payment` : 'Fee Payment'}</td><td>{money(paid)}</td></tr>
        {admissionFee>0&&<tr><td>2</td><td>Admission / Registration Fee</td><td>{money(admissionFee)}</td></tr>}
        {payment.notes&&<tr><td></td><td>{payment.notes}</td><td></td></tr>}
        <tr className={styles.total}><td></td><td>Total Amount</td><td>{money(paid)}</td></tr>
      </tbody></table>

      <div className={styles.amountWords}><IndianRupee size={18}/><span><b>Amount Received (in words):</b> <i>{amountInWords(paid)}</i></span></div>
      <div className={styles.balanceRow}><span>Total Course Fee: <b>{money(totalFee)}</b></span><span>Total Paid: <b>{money(paid)}</b></span><span>Balance Due: <b>{money(balance)}</b></span></div>

      <div className={styles.signatures}><div><span></span><b>Centre Head Sign</b></div><div><span></span><b>Centre Seal</b></div><div><span></span><b>Parent/Guardian Sign</b></div></div>
      <footer><FileText size={16}/><span>This is a computer generated fee receipt. Please obtain physical signature and centre seal after printing.</span></footer>
      <div className={styles.bottomBrand}><strong>Dream Comes True</strong><span>Skill Today&nbsp; | &nbsp;Better Tomorrow</span></div>
    </section>
  </main>
}

function ReceiptFallback(){return <main className={styles.state}><Loader2 className={styles.spin}/><p>Preparing receipt…</p></main>}
export default function ReceiptPage(){return <Suspense fallback={<ReceiptFallback/>}><ReceiptContent/></Suspense>}
