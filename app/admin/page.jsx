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

  async function removeProduct(product) {
    const confirmed = window.confirm(`Delete “${product.title}”? If this product has existing orders, keep it unpublished instead.`)
    if (!confirmed) return
    setError(''); setNotice('')
    const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id)
    if (deleteError) setError('This e-book could not be deleted. If it has order history, unpublish it instead.')
    else { setProducts(items => items.filter(p => p.id !== product.id)); setNotice('E-book deleted.') }
  }

  const activeCount = products.filter(p => p.active).length
  const featuredCount = products.filter(p => p.featured).length

  if (loading) return <section className="section"><div className="container"><div className={`empty ${styles.state}`}><Loader2 size={30} className={styles.spin}/><h2>Loading admin centre</h2><p>Verifying administrator access and loading your catalogue…</p></div></div></section>
  if (error === 'Admin access required.') return <section className="section"><div className="container"><div className={`empty ${styles.state}`}><span className={styles.stateIcon}><ShieldCheck size={31}/></span><span className="eyebrow">RESTRICTED AREA</span><h2>Administrator access required</h2><p>This area is available only to accounts with the admin role.</p><Link className="btn primary" href="/">Back to Store</Link></div></div></section>

  return <section className={`section ${styles.page}`}>
    <div className="container">
      <div className={styles.header}><div><span className="eyebrow">ADMIN CENTRE</span><h1>E-Book Management</h1><p className="muted">Manage your catalogue, pricing, visibility and featured books.</p></div><div className={styles.headerActions}><Link className={styles.refresh} href="/admin/orders"><Users size={16}/> Orders & Customers</Link><button className={styles.refresh} onClick={() => loadAdmin(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? styles.spin : ''}/> {refreshing ? 'Refreshing…' : 'Refresh'}</button><button className="btn primary" onClick={openNew}><Plus size={17}/> Add E-Book</button></div></div>
      {error && <div className={`error ${styles.message}`} role="alert"><AlertCircle size={16}/><span>{error}</span></div>}
      {notice && <div className={styles.notice} role="status"><CheckCircle2 size={16}/><span>{notice}</span></div>}
      <div className={styles.stats}><div><BookOpen size={19}/><div><b>{products.length}</b><small>Total e-books</small></div></div><div><Eye size={19}/><div><b>{activeCount}</b><small>Published</small></div></div><div><EyeOff size={19}/><div><b>{products.length - activeCount}</b><small>Unpublished</small></div></div><div><CheckCircle2 size={19}/><div><b>{featuredCount}</b><small>Featured</small></div></div></div>
      <div className={styles.toolbar}><label className={styles.search}><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, category or slug…" aria-label="Search e-books" /></label><select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter e-books"><option value="all">All books</option><option value="active">Published</option><option value="inactive">Unpublished</option><option value="featured">Featured</option>{categories.map(c => <option key={c.id} value={`cat:${c.id}`}>{c.name}</option>)}</select></div>
      <div className={styles.tableWrap}><table><thead><tr><th>E-Book</th><th>Category</th><th>Price</th><th>Status</th><th>Featured</th><th>Actions</th></tr></thead><tbody>{filtered.map(product => { const category = getCategory(product); return <tr key={product.id}><td><div className={styles.product}><div className={styles.cover}>{product.cover_url ? <img src={product.cover_url} alt=""/> : <BookOpen size={22}/>}</div><div><b>{product.title}</b><span>{product.pages ? `${product.pages} pages` : 'Digital e-book'} · /{product.slug}</span></div></div></td><td><span className={styles.category}>{category?.name || 'General'}</span></td><td><b>{money(product.price)}</b>{Number(product.compare_at_price) > Number(product.price) && <del>{money(product.compare_at_price)}</del>}</td><td><button className={`${styles.status} ${product.active ? styles.published : styles.unpublished}`} onClick={() => toggleActive(product)} title="Toggle publication status">{product.active ? <><Eye size={14}/> Published</> : <><EyeOff size={14}/> Unpublished</>}</button></td><td>{product.featured ? <span className={styles.featured}>Yes</span> : <span className={styles.no}>No</span>}</td><td><div className={styles.actions}><button className={styles.icon} onClick={() => openEdit(product)} aria-label={`Edit ${product.title}`}><Edit3 size={16}/></button><button className={`${styles.icon} ${styles.danger}`} onClick={() => removeProduct(product)} aria-label={`Delete ${product.title}`}><Trash2 size={16}/></button></div></td></tr> })}</tbody></table>{!filtered.length && <div className={styles.noResults}><Search size={25}/><b>No e-books found</b><span>Try a different search or filter.</span></div>}</div>
      <div className={styles.security}><ShieldCheck size={18}/><div><b>Protected admin workflow</b><span>Changes are made through Supabase using the signed-in account. Keep product files in protected storage and use unpublish rather than deleting products with existing sales.</span></div></div>
    </div>
    {modal && <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={modal === 'edit' ? 'Edit e-book' : 'Add e-book'} onMouseDown={e => { if (e.target === e.currentTarget) closeModal() }}><form className={styles.modal} onSubmit={saveProduct}><div className={styles.modalHead}><div><span className="eyebrow">{modal === 'edit' ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</span><h2>{modal === 'edit' ? 'Edit E-Book' : 'Add E-Book'}</h2></div><button type="button" className={styles.close} onClick={closeModal} aria-label="Close"><X size={19}/></button></div><div className={styles.formGrid}><label>Title<input name="title" value={form.title} onChange={updateField} required placeholder="E.g. MS Excel Master E-Book" /></label><label>Slug<input name="slug" value={form.slug} onChange={updateField} required placeholder="excel-master-ebook" /></label><label className={styles.full}>Description<textarea name="description" value={form.description} onChange={updateField} rows="4" placeholder="Short product description" /></label><label>Price (₹)<input name="price" type="number" min="0" step="1" value={form.price} onChange={updateField} required /></label><label>Compare-at price (₹)<input name="compare_at_price" type="number" min="0" step="1" value={form.compare_at_price} onChange={updateField} /></label><label>Category<select name="category_id" value={form.category_id} onChange={updateField}><option value="">No category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Pages<input name="pages" type="number" min="0" step="1" value={form.pages} onChange={updateField} /></label><label className={styles.full}>Cover image URL<input name="cover_url" value={form.cover_url} onChange={updateField} placeholder="https://…" /></label><label className={styles.check}><input name="active" type="checkbox" checked={Boolean(form.active)} onChange={updateField}/> Published on store</label><label className={styles.check}><input name="featured" type="checkbox" checked={Boolean(form.featured)} onChange={updateField}/> Featured product</label></div><div className={styles.modalFoot}><button type="button" className="btn" onClick={closeModal} disabled={saving}>Cancel</button><button type="submit" className="btn primary" disabled={saving}>{saving ? <><Loader2 size={16} className={styles.spin}/> Saving…</> : <>{modal === 'edit' ? 'Save Changes' : 'Create E-Book'}</>}</button></div></form></div>}
  </section>
}
