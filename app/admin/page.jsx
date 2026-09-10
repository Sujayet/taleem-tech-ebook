'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BookOpen, CheckCircle2, ClipboardList, Edit3, Eye, EyeOff, Loader2, Plus, RefreshCw, Search, ShieldCheck, Trash2, Users, X } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './admin.module.css'

const emptyForm = { title: '', slug: '', description: '', price: '', compare_at_price: '', category_id: '', pages: '', cover_url: '', active: true, featured: false }
const getCategory = (product) => Array.isArray(product.categories) ? product.categories[0] : product.categories

export default function Admin() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadAdmin(showRefresh = false) {
    if (showRefresh) setRefreshing(true)
    setError('')
    const { data: auth, error: authError } = await supabase.auth.getUser()
    const currentUser = auth?.user || null
    setUser(currentUser)
    if (authError || !currentUser) { window.location.href = '/login?next=/admin'; return }
    const { data: p, error: profileError } = await supabase.from('profiles').select('full_name,role').eq('id', currentUser.id).single()
    if (profileError || p?.role !== 'admin') { setProfile(p || null); setError('Admin access required.'); setLoading(false); setRefreshing(false); return }
    setProfile(p)
    const [{ data, error: productError }, { data: categoryData, error: categoryError }] = await Promise.all([
      supabase.from('products').select('id,title,slug,description,price,compare_at_price,cover_url,pages,featured,category_id,active,created_at,categories(id,name,slug)').order('created_at', { ascending: false }),
      supabase.from('categories').select('id,name,slug').order('name'),
    ])
    if (productError) setError(productError.message || 'We could not load the product catalogue.')
    else if (categoryError) setError(categoryError.message || 'We could not load product categories.')
    setProducts(data || [])
    setCategories(categoryData || [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { loadAdmin() }, [])

  const filtered = useMemo(() => products.filter(p => {
    const category = getCategory(p)
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || [p.title, p.slug, category?.name, p.description].some(v => String(v || '').toLowerCase().includes(q))
    const matchesFilter = filter === 'all' || (filter === 'active' && p.active) || (filter === 'inactive' && !p.active) || (filter === 'featured' && p.featured) || (filter === `cat:${p.category_id}`)
    return matchesSearch && matchesFilter
  }), [products, search, filter])

  function openNew() { setForm(emptyForm); setModal('new'); setError(''); setNotice('') }
  function openEdit(product) { setForm({ ...emptyForm, ...product, category_id: product.category_id || '', price: product.price ?? '', compare_at_price: product.compare_at_price ?? '', pages: product.pages ?? '' }); setModal('edit'); setError(''); setNotice('') }
  function closeModal() { if (!saving) setModal(null) }
  function updateField(e) { const { name, value, type, checked } = e.target; setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value })) }

  async function saveProduct(e) {
    e.preventDefault(); setSaving(true); setError(''); setNotice('')
    const payload = { title: form.title.trim(), slug: form.slug.trim(), description: form.description.trim(), price: Number(form.price) || 0, compare_at_price: Number(form.compare_at_price) || 0, category_id: form.category_id || null, pages: Number(form.pages) || 0, cover_url: form.cover_url.trim(), active: Boolean(form.active), featured: Boolean(form.featured) }
    if (!payload.title || !payload.slug) { setError('Title and slug are required.'); setSaving(false); return }
    const result = modal === 'edit' ? await supabase.from('products').update(payload).eq('id', form.id) : await supabase.from('products').insert(payload).select('id,title,slug,description,price,compare_at_price,cover_url,pages,featured,category_id,active,created_at,categories(id,name,slug)').single()
    if (result.error) setError(result.error.message || 'Could not save this e-book.')
    else { setNotice(modal === 'edit' ? 'E-book updated successfully.' : 'E-book added successfully.'); setModal(null); await loadAdmin(true) }
    setSaving(false)
  }

  async function toggleActive(product) {
    setError(''); setNotice('')
    const { error: updateError } = await supabase.from('products').update({ active: !product.active }).eq('id', product.id)
    if (updateError) setError(updateError.message || 'Could not change publication status.')
    else { setProducts(items => items.map(p => p.id === product.id ? { ...p, active: !p.active } : p)); setNotice(`${product.title} is now ${product.active ? 'unpublished' : 'published'}.`) }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete “${product.title}”? This cannot be undone.`)) return
    setError(''); setNotice('')
    const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id)
    if (deleteError) setError(deleteError.message || 'Could not delete this e-book.')
    else { setProducts(items => items.filter(p => p.id !== product.id)); setNotice('E-book deleted successfully.') }
  }

  if (loading) return <main className={styles.state}><Loader2 className={styles.spin} size={28}/><p>Loading Admin Centre…</p></main>
  if (!user || profile?.role !== 'admin') return <main className={styles.state}><ShieldCheck size={32}/><h1>Admin access required</h1><p>{error || 'This area is restricted to administrators.'}</p><Link href="/">Back to store</Link></main>

  return <main className={styles.page}>
    <header className={styles.header}><div><span className={styles.eyebrow}><ShieldCheck size={15}/> Admin Centre</span><h1>Store Management</h1><p>Manage your e-book catalogue and business operations.</p></div><div className={styles.headerActions}><Link className={styles.refresh} href="/admin/orders"><Users size={16}/> Orders & Customers</Link><Link className={styles.refresh} href="/admin/crm"><ClipboardList size={16}/> Student & Fees CRM</Link><button className={styles.refresh} onClick={() => loadAdmin(true)}><RefreshCw size={16} className={refreshing ? styles.spin : ''}/> Refresh</button><button className={styles.add} onClick={openNew}><Plus size={17}/> Add E-book</button></div></header>
    {error && <div className={styles.alert}><AlertCircle size={17}/><span>{error}</span><button onClick={() => setError('')}><X size={16}/></button></div>}
    {notice && <div className={styles.success}><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice('')}><X size={16}/></button></div>}
    <section className={styles.stats}><div><BookOpen/><span>Total E-books</span><strong>{products.length}</strong></div><div><Eye/><span>Published</span><strong>{products.filter(p=>p.active).length}</strong></div><div><EyeOff/><span>Drafts</span><strong>{products.filter(p=>!p.active).length}</strong></div><div><CheckCircle2/><span>Featured</span><strong>{products.filter(p=>p.featured).length}</strong></div></section>
    <section className={styles.toolbar}><div className={styles.search}><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search e-books…"/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All products</option><option value="active">Published</option><option value="inactive">Drafts</option><option value="featured">Featured</option>{categories.map(c=><option key={c.id} value={`cat:${c.id}`}>{c.name}</option>)}</select></section>
    <section className={styles.grid}>{filtered.map(product=>{const category=getCategory(product);return <article className={styles.card} key={product.id}><div className={styles.cover}>{product.cover_url?<img src={product.cover_url} alt=""/>:<BookOpen size={34}/>}<span className={product.active?styles.live:styles.draft}>{product.active?'Published':'Draft'}</span></div><div className={styles.cardBody}><div className={styles.meta}>{category?.name||'Uncategorized'}{product.featured&&<span>Featured</span>}</div><h2>{product.title}</h2><p>{product.description||'No description added.'}</p><div className={styles.price}><strong>{money(product.price)}</strong>{product.compare_at_price>product.price&&<del>{money(product.compare_at_price)}</del>}<span>{product.pages||0} pages</span></div><div className={styles.cardActions}><button onClick={()=>openEdit(product)}><Edit3 size={15}/> Edit</button><button onClick={()=>toggleActive(product)}>{product.active?<><EyeOff size={15}/> Unpublish</>:<><Eye size={15}/> Publish</>}</button><button className={styles.danger} onClick={()=>deleteProduct(product)}><Trash2 size={15}/> Delete</button></div></div></article>})}</section>
    {!filtered.length&&<div className={styles.empty}><BookOpen size={32}/><h3>No e-books found</h3><p>Try changing your search or filters.</p></div>}
    {modal&&<div className={styles.modalBackdrop}><div className={styles.modal}><div className={styles.modalHead}><div><h2>{modal==='edit'?'Edit E-book':'Add E-book'}</h2><p>Keep your catalogue information accurate and customer-ready.</p></div><button onClick={closeModal}><X/></button></div><form onSubmit={saveProduct}><div className={styles.formGrid}><label>Title*<input name="title" value={form.title} onChange={updateField} required/></label><label>Slug*<input name="slug" value={form.slug} onChange={updateField} required/></label><label className={styles.full}>Description<textarea name="description" rows="4" value={form.description} onChange={updateField}/></label><label>Price<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField}/></label><label>Compare at price<input name="compare_at_price" type="number" min="0" step="0.01" value={form.compare_at_price} onChange={updateField}/></label><label>Category<select name="category_id" value={form.category_id} onChange={updateField}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Pages<input name="pages" type="number" min="0" value={form.pages} onChange={updateField}/></label><label className={styles.full}>Cover image URL<input name="cover_url" value={form.cover_url} onChange={updateField}/></label><label className={styles.check}><input name="active" type="checkbox" checked={form.active} onChange={updateField}/> Published</label><label className={styles.check}><input name="featured" type="checkbox" checked={form.featured} onChange={updateField}/> Featured</label></div><div className={styles.modalActions}><button type="button" className={styles.cancel} onClick={closeModal}>Cancel</button><button className={styles.add} disabled={saving}>{saving?'Saving…':modal==='edit'?'Save Changes':'Create E-book'}</button></div></form></div></div>}
  </main>
}
