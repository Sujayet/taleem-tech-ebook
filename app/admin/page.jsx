'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowUpRight, BookOpen, CheckCircle2, ClipboardList, Eye, EyeOff, FolderOpen, LayoutDashboard, Loader2, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Trash2, Users, Settings2 } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './admin.module.css'

const getCategory=p=>Array.isArray(p.categories)?p.categories[0]:p.categories

export default function Admin(){
 const [user,setUser]=useState(null),[profile,setProfile]=useState(null),[products,setProducts]=useState([]),[categories,setCategories]=useState([]),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[search,setSearch]=useState(''),[filter,setFilter]=useState('all')
 async function load(refresh=false){
  if(refresh)setRefreshing(true);setError('')
  const {data:auth,error:ae}=await supabase.auth.getUser();const current=auth?.user||null;setUser(current)
  if(ae||!current){window.location.href='/login?next=/admin';return}
  const {data:p,error:pe}=await supabase.from('profiles').select('full_name,role').eq('id',current.id).single()
  if(pe||p?.role!=='admin'){setProfile(p||null);setError('Admin access required.');setLoading(false);setRefreshing(false);return}
  setProfile(p)
  const [{data,error:qe},{data:cats,error:ce}]=await Promise.all([
   supabase.from('products').select('id,title,slug,description,price,compare_at_price,cover_url,pages,featured,category_id,active,created_at,categories(id,name,slug),image_urls').order('created_at',{ascending:false}),
   supabase.from('categories').select('id,name,slug').order('name')
  ])
  if(qe)setError(qe.message||'Could not load catalogue.');else setProducts(data||[])
  if(ce)setError(ce.message||'Could not load categories.');else setCategories(cats||[])
  setLoading(false);setRefreshing(false)
 }
 useEffect(()=>{load()},[])
 const filtered=useMemo(()=>products.filter(p=>{const q=search.trim().toLowerCase();const c=getCategory(p);const text=[p.title,p.slug,p.description,c?.name].join(' ').toLowerCase();return (!q||text.includes(q))&&(filter==='all'||filter==='active'&&p.active||filter==='draft'&&!p.active||filter==='featured'&&p.featured||filter===`cat:${p.category_id}`)}),[products,search,filter])
 const publish=products.filter(p=>p.active).length,drafts=products.length-publish,featured=products.filter(p=>p.featured).length
 async function toggle(p){setError('');const {error:e}=await supabase.from('products').update({active:!p.active}).eq('id',p.id);if(e)setError(e.message);else{setProducts(x=>x.map(i=>i.id===p.id?{...i,active:!p.active}:i));setNotice(`${p.title} is now ${p.active?'a draft':'published'}.`)}}
 async function remove(p){if(!confirm(`Delete “${p.title}”? This cannot be undone.`))return;const {error:e}=await supabase.from('products').delete().eq('id',p.id);if(e)setError(e.message);else{setProducts(x=>x.filter(i=>i.id!==p.id));setNotice('Product deleted successfully.')}}
 if(loading)return <main className={styles.state}><Loader2 size={30} className={styles.spin}/><h2>Loading Digital Store Admin…</h2><p>Preparing your catalogue workspace.</p></main>
 if(!user||profile?.role!=='admin')return <main className={styles.state}><ShieldCheck size={32}/><h2>Administrator access required</h2><p>{error||'This workspace is restricted.'}</p><Link href="/">Back to Store</Link></main>
 return <main className={styles.page}>
  <header className={styles.header}><div className={styles.headerCopy}><span className={styles.eyebrow}><ShieldCheck size={15}/> Administrator workspace</span><h1>Digital Store Command Centre</h1><p>Manage your complete digital-product catalogue, delivery assets and customer-facing listings.</p></div><div className={styles.headerActions}><Link href="/" target="_blank" className={styles.secondary}><ArrowUpRight size={16}/> View Store</Link><button className={styles.secondary} onClick={()=>load(true)}><RefreshCw size={16} className={refreshing?styles.spin:''}/> Refresh</button><Link href="/admin/products/new/edit" className={styles.primary}><Plus size={17}/> New Product</Link></div></header>
  <nav className={styles.quickNav}><span className={styles.navActive}><LayoutDashboard size={16}/> Catalogue</span><Link href="/admin/orders"><Users size={16}/> Orders & Customers <ArrowUpRight size={13}/></Link><Link href="/admin/crm"><ClipboardList size={16}/> Student & Fees CRM <ArrowUpRight size={13}/></Link><Link href="/ebooks"><BookOpen size={16}/> Customer Store <ArrowUpRight size={13}/></Link></nav>
  {error&&<div className={styles.alert}><AlertCircle size={17}/><span>{error}</span></div>}{notice&&<div className={styles.success}><CheckCircle2 size={17}/><span>{notice}</span></div>}
  <section className={styles.stats}><div className={styles.statCard}><span className={styles.statIcon}><BookOpen/></span><div><small>Total products</small><strong>{products.length}</strong><span>Across your catalogue</span></div></div><div className={styles.statCard}><span className={styles.statIcon}><Eye/></span><div><small>Published</small><strong>{publish}</strong><span>Visible in store</span></div></div><div className={styles.statCard}><span className={styles.statIcon}><EyeOff/></span><div><small>Drafts</small><strong>{drafts}</strong><span>Hidden from customers</span></div></div><div className={styles.statCard}><span className={styles.statIcon}><Sparkles/></span><div><small>Featured</small><strong>{featured}</strong><span>Highlighted products</span></div></div></section>
  <section className={styles.sectionIntro}><div><span className={styles.sectionKicker}>PRODUCT MANAGEMENT</span><h2>Digital products</h2><p>Open any product to manage its full CRM-style configuration.</p></div><div className={styles.categoryCount}><FolderOpen size={17}/><strong>{categories.length}</strong><span>categories</span></div></section>
  <section className={styles.toolbar}><div className={styles.search}><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products, descriptions or categories…"/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All products</option><option value="active">Published</option><option value="draft">Drafts</option><option value="featured">Featured</option>{categories.map(c=><option key={c.id} value={`cat:${c.id}`}>{c.name}</option>)}</select></section>
  <section className={styles.grid}>{filtered.map(p=>{const c=getCategory(p),count=1+(Array.isArray(p.image_urls)?p.image_urls.length:0);return <article className={styles.card} key={p.id}><div className={styles.cover}>{p.cover_url?<img src={p.cover_url} alt=""/>:<BookOpen size={34}/>}<span className={p.active?styles.live:styles.draft}>{p.active?'Published':'Draft'}</span><small className={styles.imageCount}>{count} {count===1?'image':'images'}</small></div><div className={styles.cardBody}><div className={styles.meta}><span>{c?.name||'Uncategorized'}</span>{p.featured&&<b><Sparkles size={12}/> Featured</b>}</div><h2>{p.title}</h2><p>{p.description||'No description added yet.'}</p><div className={styles.price}><strong>{money(p.price)}</strong>{Number(p.compare_at_price)>Number(p.price)&&<del>{money(p.compare_at_price)}</del>}<span>{p.pages||0} pages</span></div><div className={styles.cardActions}><Link href={`/admin/products/${p.id}/edit`}><Settings2 size={15}/> Manage Product</Link><button onClick={()=>toggle(p)}>{p.active?<><EyeOff size={15}/> Draft</>:<><Eye size={15}/> Publish</>}</button><button className={styles.danger} onClick={()=>remove(p)}><Trash2 size={15}/></button></div></div></article>})}</section>
  {!filtered.length&&<div className={styles.empty}><Search size={30}/><h3>No products found</h3><p>Try another search term or filter.</p></div>}
  <div className={styles.security}><ShieldCheck size={21}/><div><b>Administrator-only workspace</b><span>The product CRM keeps catalogue information, delivery assets, images, variants and specifications in one controlled workspace.</span></div></div>
 </main>
}
