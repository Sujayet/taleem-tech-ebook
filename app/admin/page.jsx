'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowUpRight, BookOpen, CheckCircle2, ClipboardList, Edit3, Eye, EyeOff, FolderOpen, LayoutDashboard, Loader2, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Trash2, Users, X } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './admin.module.css'

const emptyForm = { title: '', slug: '', description: '', price: '', compare_at_price: '', category_id: '', pages: '', cover_url: '', image_urls: '', active: true, featured: false }
const getCategory = (product) => Array.isArray(product.categories) ? product.categories[0] : product.categories

export default function Admin() {
  const [user, setUser] = useState(null), [profile, setProfile] = useState(null), [products, setProducts] = useState([]), [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('all'), [modal, setModal] = useState(null), [form, setForm] = useState(emptyForm), [saving, setSaving] = useState(false)

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
    let items = data || []
    const { data: galleryData, error: galleryError } = await supabase.from('products').select('id,image_urls')
    if (!galleryError && galleryData) { const galleryMap = new Map(galleryData.map(row => [row.id, row.image_urls])); items = items.map(item => ({ ...item, image_urls: galleryMap.get(item.id) || [] })) }
    setProducts(items); setCategories(categoryData || []); setLoading(false); setRefreshing(false)
  }

  useEffect(() => { loadAdmin() }, [])
  const filtered = useMemo(() => products.filter(p => { const category = getCategory(p), q = search.trim().toLowerCase(); const matchesSearch = !q || [p.title,p.slug,category?.name,p.description].some(v => String(v || '').toLowerCase().includes(q)); const matchesFilter = filter === 'all' || (filter === 'active' && p.active) || (filter === 'inactive' && !p.active) || (filter === 'featured' && p.featured) || filter === `cat:${p.category_id}`; return matchesSearch && matchesFilter }), [products, search, filter])
  const published = products.filter(p => p.active).length
  const drafts = products.filter(p => !p.active).length
  const featured = products.filter(p => p.featured).length
  function openNew() { setForm(emptyForm); setModal('new'); setError(''); setNotice('') }
  function openEdit(product) { setForm({ ...emptyForm, ...product, category_id: product.category_id || '', price: product.price ?? '', compare_at_price: product.compare_at_price ?? '', pages: product.pages ?? '', image_urls: Array.isArray(product.image_urls) ? product.image_urls.join('\n') : '' }); setModal('edit'); setError(''); setNotice('') }
  function closeModal() { if (!saving) setModal(null) }
  function updateField(e) { const { name, value, type, checked } = e.target; setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value })) }

  async function saveProduct(e) {
    e.preventDefault(); setSaving(true); setError(''); setNotice('')
    const imageUrls = String(form.image_urls || '').split('\n').map(url => url.trim()).filter(Boolean).filter((url,index,list) => list.indexOf(url) === index)
    const payload = { title: form.title.trim(), slug: form.slug.trim(), description: form.description.trim(), price: Number(form.price) || 0, compare_at_price: Number(form.compare_at_price) || 0, category_id: form.category_id || null, pages: Number(form.pages) || 0, cover_url: form.cover_url.trim(), active: Boolean(form.active), featured: Boolean(form.featured) }
    if (!payload.title || !payload.slug) { setError('Title and slug are required.'); setSaving(false); return }
    const result = modal === 'edit' ? await supabase.from('products').update(payload).eq('id', form.id) : await supabase.from('products').insert(payload).select('id,title,slug,description,price,compare_at_price,cover_url,pages,featured,category_id,active,created_at,categories(id,name,slug)').single()
    if (result.error) { setError(result.error.message || 'Could not save this digital product.'); setSaving(false); return }
    const savedId = form.id || result.data?.id
    if (savedId) {
      const { error: galleryError } = await supabase.from('products').update({ image_urls: imageUrls }).eq('id', savedId)
      if (galleryError) setNotice('Product saved. Gallery images need the Supabase image_urls migration before they can be stored.')
      else setNotice(modal === 'edit' ? 'Digital product updated successfully.' : 'Digital product added successfully.')
    }
    setModal(null); await loadAdmin(true); setSaving(false)
  }

  async function toggleActive(product) { setError(''); setNotice(''); const { error: updateError } = await supabase.from('products').update({ active: !product.active }).eq('id', product.id); if (updateError) setError(updateError.message || 'Could not change publication status.'); else { setProducts(items => items.map(p => p.id === product.id ? { ...p, active: !p.active } : p)); setNotice(`${product.title} is now ${product.active ? 'unpublished' : 'published'}.`) } }
  async function deleteProduct(product) { if (!window.confirm(`Delete “${product.title}”? This cannot be undone.`)) return; setError(''); setNotice(''); const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id); if (deleteError) setError(deleteError.message || 'Could not delete this digital product.'); else { setProducts(items => items.filter(p => p.id !== product.id)); setNotice('Digital product deleted successfully.') } }

  if (loading) return <main className={styles.state}><Loader2 className={styles.spin} size={28}/><p>Loading Admin Centre…</p></main>
  if (!user || profile?.role !== 'admin') return <main className={styles.state}><ShieldCheck size={32}/><h1>Admin access required</h1><p>{error || 'This area is restricted to administrators.'}</p><Link href="/">Back to store</Link></main>
  return <main className={styles.page}>
    <header className={styles.header}>
      <div className={styles.headerCopy}><span className={styles.eyebrow}><ShieldCheck size={15}/> Administrator workspace</span><h1>Digital Store Command Centre</h1><p>Manage products, publishing, catalogue quality and customer-facing content from one place.</p></div>
      <div className={styles.headerActions}><Link className={styles.secondary} href="/" target="_blank"><ArrowUpRight size={16}/> View Store</Link><button className={styles.secondary} onClick={() => loadAdmin(true)}><RefreshCw size={16} className={refreshing ? styles.spin : ''}/> Refresh</button><button className={styles.primary} onClick={openNew}><Plus size={17}/> Add Product</button></div>
    </header>

    <nav className={styles.quickNav}><span className={styles.navActive}><LayoutDashboard size={16}/> Catalogue</span><Link href="/admin/orders"><Users size={16}/> Orders & Customers <ArrowUpRight size={13}/></Link><Link href="/admin/crm"><ClipboardList size={16}/> Student & Fees CRM <ArrowUpRight size={13}/></Link><Link href="/ebooks"><BookOpen size={16}/> Customer Store <ArrowUpRight size={13}/></Link></nav>

    {error && <div className={styles.alert}><AlertCircle size={17}/><span>{error}</span><button onClick={() => setError('')}><X size={16}/></button></div>}
    {notice && <div className={styles.success}><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice('')}><X size={16}/></button></div>}

    <section className={styles.stats}>
      <div className={styles.statCard}><span className={styles.statIcon}><BookOpen/></span><div><small>Total products</small><strong>{products.length}</strong><span>Across your catalogue</span></div></div>
      <div className={styles.statCard}><span className={styles.statIcon}><Eye/></span><div><small>Published</small><strong>{published}</strong><span>Visible in the store</span></div></div>
      <div className={styles.statCard}><span className={styles.statIcon}><EyeOff/></span><div><small>Drafts</small><strong>{drafts}</strong><span>Hidden from customers</span></div></div>
      <div className={styles.statCard}><span className={styles.statIcon}><Sparkles/></span><div><small>Featured</small><strong>{featured}</strong><span>Highlighted products</span></div></div>
    </section>

    <section className={styles.sectionIntro}><div><span className={styles.sectionKicker}>CATALOGUE</span><h2>Digital products</h2><p>Keep every listing polished, discoverable and ready for instant delivery.</p></div><div className={styles.categoryCount}><FolderOpen size={17}/><strong>{categories.length}</strong><span>categories</span></div></section>

    <section className={styles.toolbar}><div className={styles.search}><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products, descriptions or categories…"/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All products</option><option value="active">Published</option><option value="inactive">Drafts</option><option value="featured">Featured</option>{categories.map(c=><option key={c.id} value={`cat:${c.id}`}>{c.name}</option>)}</select></section>

    <section className={styles.grid}>{filtered.map(product=>{const category=getCategory(product), galleryCount=1+(Array.isArray(product.image_urls)?product.image_urls.length:0);return <article className={styles.card} key={product.id}><div className={styles.cover}>{product.cover_url?<img src={product.cover_url} alt=""/>:<BookOpen size={34}/>}<span className={product.active?styles.live:styles.draft}>{product.active?'Published':'Draft'}</span>{galleryCount>1&&<small className={styles.imageCount}>{galleryCount} images</small>}</div><div className={styles.cardBody}><div className={styles.meta}><span>{category?.name||'Uncategorized'}</span>{product.featured&&<b><Sparkles size={12}/> Featured</b>}</div><h2>{product.title}</h2><p>{product.description||'No description added yet.'}</p><div className={styles.price}><strong>{money(product.price)}</strong>{product.compare_at_price>product.price&&<del>{money(product.compare_at_price)}</del>}<span>{product.pages||0} pages</span></div><div className={styles.cardActions}><button onClick={()=>openEdit(product)}><Edit3 size={15}/> Edit</button><button onClick={()=>toggleActive(product)}>{product.active?<><EyeOff size={15}/> Unpublish</>:<><Eye size={15}/> Publish</>}</button><button className={styles.danger} onClick={()=>deleteProduct(product)}><Trash2 size={15}/></button></div></div></article>})}</section>
    {!filtered.length&&<div className={styles.empty}><Search size={30}/><h3>No products found</h3><p>Try another search term or filter.</p></div>}

    <div className={styles.security}><ShieldCheck size={21}/><div><b>Administrator-only workspace</b><span>Product changes are saved directly to your connected catalogue. Review titles, pricing, images and publication status before making a product live.</span></div></div>

    {modal&&<div className={styles.modalBackdrop}><div className={styles.modal}><div className={styles.modalHead}><div><span className={styles.sectionKicker}>{modal==='edit'?'EDIT PRODUCT':'NEW PRODUCT'}</span><h2>{modal==='edit'?'Edit digital product':'Add digital product'}</h2><p>Build a complete listing for the customer-facing product page.</p></div><button className={styles.close} onClick={closeModal}><X/></button></div><form onSubmit={saveProduct}><div className={styles.formGrid}><label>Product title*<input name="title" value={form.title} onChange={updateField} required/></label><label>URL slug*<input name="slug" value={form.slug} onChange={updateField} required/></label><label className={styles.full}>Description<textarea name="description" rows="4" value={form.description} onChange={updateField} placeholder="Explain what the customer gets and who it is for…"/></label><label>Price<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField}/></label><label>Compare-at price<input name="compare_at_price" type="number" min="0" step="0.01" value={form.compare_at_price} onChange={updateField}/></label><label>Category<select name="category_id" value={form.category_id} onChange={updateField}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Pages<input name="pages" type="number" min="0" value={form.pages} onChange={updateField}/></label><label className={styles.full}>Cover image URL<input name="cover_url" value={form.cover_url} onChange={updateField} placeholder="https://…"/></label><label className={styles.full}>Additional product image URLs<textarea name="image_urls" rows="5" value={form.image_urls} onChange={updateField} placeholder="One preview image URL per line"/><small>Add interior pages, screenshots or preview images. The cover is automatically used as the first gallery image.</small></label><label className={styles.check}><input name="active" type="checkbox" checked={form.active} onChange={updateField}/> Publish product</label><label className={styles.check}><input name="featured" type="checkbox" checked={form.featured} onChange={updateField}/> Feature on store</label></div><div className={styles.modalActions}><button type="button" className={styles.cancel} onClick={closeModal}>Cancel</button><button className={styles.primary} disabled={saving}>{saving?'Saving…':modal==='edit'?'Save Changes':'Create Product'}</button></div></form></div></div>}
  </main>
}
