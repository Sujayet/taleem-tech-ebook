'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, ImagePlus, Layers3, Loader2, Package, Plus, Save, ShieldCheck, Trash2, UploadCloud, X, Zap } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './product-edit.module.css'

const empty = { title:'', slug:'', description:'', brand:'Taleem Tech', category_id:'', product_type:'Digital Product', tags:'', status:'active', price:'', compare_at_price:'', pages:'', cover_url:'', delivery_url:'', backup_url:'', access_instructions:'', specifications:[] }
const blankVariant = { sku:'', name:'', price:'', compare_at_price:'', stock:0, color:'', size_volume:'', material:'' }

export default function ProductEditPage({ params }) {
  const isNew = params.id === 'new'
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[authorized,setAuthorized]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
  const [categories,setCategories]=useState([]),[form,setForm]=useState(empty),[images,setImages]=useState([]),[variants,setVariants]=useState([]),[newSpec,setNewSpec]=useState({key:'',value:''}),[preview,setPreview]=useState(false)

  async function load(){
    setLoading(true);setError('')
    const {data:{user},error:authError}=await supabase.auth.getUser()
    if(authError||!user){window.location.href=`/login?next=/admin/products/${params.id}/edit`;return}
    const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
    if(profile?.role!=='admin'){setError('Administrator access is required.');setLoading(false);return}
    setAuthorized(true)
    const {data:cats,error:catError}=await supabase.from('categories').select('id,name,slug').order('name')
    if(catError) setError(catError.message); else setCategories(cats||[])
    if(isNew){setLoading(false);return}
    const {data:p,error:pe}=await supabase.from('products').select('id,title,slug,description,brand,product_type,tags,category_id,active,price,compare_at_price,pages,cover_url,image_urls,delivery_url,backup_url,access_instructions,specifications').eq('id',params.id).single()
    if(pe){setError(pe.message||'Product could not be loaded.');setLoading(false);return}
    setForm({...empty,...p,tags:Array.isArray(p.tags)?p.tags.join(', '):p.tags||'',status:p.active?'active':'draft',specifications:Object.entries(p.specifications||{}).map(([key,value])=>({key,value:String(value)}))})
    setImages(Array.isArray(p.image_urls)?p.image_urls:[])
    const {data:v,error:ve}=await supabase.from('product_variants').select('id,sku,name,price,compare_at_price,stock,color,size_volume,material,active').eq('product_id',params.id).order('created_at')
    if(!ve)setVariants(v||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[params.id])

  const update=(key,value)=>setForm(x=>({...x,[key]:value}))
  const addImage=()=>setImages(x=>[...x,''])
  const addSpec=()=>{if(!newSpec.key.trim())return;setForm(x=>({...x,specifications:[...x.specifications,{key:newSpec.key.trim(),value:newSpec.value.trim()}]}));setNewSpec({key:'',value:''})}
  const updateSpec=(i,key,value)=>setForm(x=>({...x,specifications:x.specifications.map((s,n)=>n===i?{...s,[key]:value}:s)}))
  const removeSpec=i=>setForm(x=>({...x,specifications:x.specifications.filter((_,n)=>n!==i)}))
  const updateVariant=(i,key,value)=>setVariants(x=>x.map((v,n)=>n===i?{...v,[key]:value}:v))
  const addVariant=()=>setVariants(x=>[...x,{...blankVariant,price:form.price}])

  async function save(e){
    e.preventDefault();setSaving(true);setError('');setNotice('')
    const specificationObject=Object.fromEntries(form.specifications.filter(s=>s.key.trim()).map(s=>[s.key.trim(),s.value]))
    const payload={title:form.title.trim(),slug:form.slug.trim(),description:form.description.trim(),brand:form.brand.trim(),product_type:form.product_type.trim()||'Digital Product',tags:form.tags.split(',').map(x=>x.trim()).filter(Boolean),category_id:form.category_id||null,active:form.status==='active',price:Number(form.price)||0,compare_at_price:Number(form.compare_at_price)||0,pages:Number(form.pages)||0,cover_url:form.cover_url.trim(),image_urls:images.map(x=>x.trim()).filter(Boolean),delivery_url:form.delivery_url.trim(),backup_url:form.backup_url.trim(),access_instructions:form.access_instructions.trim(),specifications:specificationObject}
    if(!payload.title||!payload.slug){setError('Product name and slug are required.');setSaving(false);return}
    let productId=params.id
    const result=isNew?await supabase.from('products').insert(payload).select('id').single():await supabase.from('products').update(payload).eq('id',params.id).select('id').single()
    if(result.error){setError(result.error.message||'Could not save product.');setSaving(false);return}
    productId=result.data?.id||productId
    const {error:deleteError}=await supabase.from('product_variants').delete().eq('product_id',productId)
    if(deleteError){setError(deleteError.message);setSaving(false);return}
    const validVariants=variants.filter(v=>String(v.sku||'').trim()).map(v=>({product_id:productId,sku:String(v.sku).trim(),name:String(v.name||'').trim(),price:Number(v.price)||0,compare_at_price:Number(v.compare_at_price)||0,stock:Number(v.stock)||0,color:String(v.color||'').trim(),size_volume:String(v.size_volume||'').trim(),material:String(v.material||'').trim(),active:v.active!==false}))
    if(validVariants.length){const {error:variantError}=await supabase.from('product_variants').insert(validVariants);if(variantError){setError(variantError.message);setSaving(false);return}}
    setNotice(isNew?'Product created successfully.':'Product updated successfully.')
    if(isNew)setTimeout(()=>window.location.href=`/admin/products/${productId}/edit`,400)
    setSaving(false)
  }

  const gallery=useMemo(()=>images.filter(Boolean),[images])
  if(loading)return <main className={styles.state}><Loader2 className={styles.spin} size={30}/><h2>Loading Product CRM…</h2><p>Preparing your product workspace.</p></main>
  if(!authorized)return <main className={styles.state}><ShieldCheck size={32}/><h2>Administrator access required</h2><p>{error}</p><Link href="/admin">Back to Admin Centre</Link></main>

  return <main className={styles.page}>
    <header className={styles.topbar}><Link href="/admin" className={styles.back}><ArrowLeft size={17}/> Products</Link><div className={styles.topActions}><button className={styles.secondary} type="button" onClick={()=>setPreview(!preview)}><Eye size={16}/> {preview?'Close Preview':'Live Preview'}</button><button className={styles.primary} form="productForm" disabled={saving}><Save size={16}/> {saving?'Saving…':'Save Product'}</button></div></header>
    <div className={styles.heading}><div><span className={styles.eyebrow}><Package size={15}/> PRODUCT CRM</span><h1>{isNew?'Create digital product':form.title||'Edit product'}</h1><p>Manage product attributes, pricing, digital delivery, gallery, variants and specifications.</p></div><span className={`${styles.status} ${form.status==='active'?styles.active:styles.draft}`}>{form.status==='active'?'Active · Visible to customers':'Draft · Hidden from customers'}</span></div>
    {error&&<div className={styles.alert}><AlertCircle size={17}/><span>{error}</span><button onClick={()=>setError('')}><X size={16}/></button></div>}{notice&&<div className={styles.success}><CheckCircle2 size={17}/><span>{notice}</span></div>}

    <form id="productForm" onSubmit={save} className={styles.layout}>
      <div className={styles.main}>
        <section className={styles.card}><div className={styles.cardHead}><div><span className={styles.step}>01</span><div><h2>Basic Information</h2><p>Core product information shown throughout the storefront.</p></div></div></div><div className={styles.grid}><label>Product Name*<input value={form.title} onChange={e=>update('title',e.target.value)} required placeholder="e.g. Spoken English Complete Course"/></label><label>Brand / Vendor<input value={form.brand} onChange={e=>update('brand',e.target.value)} placeholder="Taleem Tech"/></label><label>Category*<select value={form.category_id} onChange={e=>update('category_id',e.target.value)} required><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Product Type*<select value={form.product_type} onChange={e=>update('product_type',e.target.value)}><option>Digital Product</option><option>E-Book</option><option>Course</option><option>Template</option><option>Notes & Study Material</option><option>Document</option><option>Software / Resource</option></select></label><label>URL Slug*<input value={form.slug} onChange={e=>update('slug',e.target.value)} required/></label><label>Status<select value={form.status} onChange={e=>update('status',e.target.value)}><option value="active">Active (Visible to public)</option><option value="draft">Draft (Hidden)</option></select></label><label className={styles.full}>Description<textarea rows="7" value={form.description} onChange={e=>update('description',e.target.value)} placeholder="Describe the product, learning outcomes and what the customer receives…"/></label><label className={styles.full}>Tags <span className={styles.help}>comma separated</span><input value={form.tags} onChange={e=>update('tags',e.target.value)} placeholder="ebooks, digital products, spoken english"/></label></div></section>

        <section className={styles.card}><div className={styles.cardHead}><div><span className={styles.step}>02</span><div><h2>Pricing & Product Details</h2><p>Set your selling price and the information customers need.</p></div></div></div><div className={styles.grid}><label>Price (INR)*<input type="number" min="0" step="0.01" value={form.price} onChange={e=>update('price',e.target.value)} required/></label><label>Compare at Price (INR)<input type="number" min="0" step="0.01" value={form.compare_at_price} onChange={e=>update('compare_at_price',e.target.value)}/></label><label>Pages / Lessons<input type="number" min="0" value={form.pages} onChange={e=>update('pages',e.target.value)}/></label><label>Primary Product Type<input value={form.product_type} readOnly/></label></div><div className={styles.pricePreview}><span>Store price</span><strong>{money(form.price)}</strong>{Number(form.compare_at_price)>Number(form.price)&&<><del>{money(form.compare_at_price)}</del><b>{Math.round((1-Number(form.price)/Number(form.compare_at_price))*100)}% OFF</b></>}</div></section>

        <section className={`${styles.card} ${styles.delivery}`}><div className={styles.cardHead}><div><span className={styles.step}>03</span><div><h2><Zap size={19}/> Digital Delivery & Assets</h2><p>This content is delivered automatically after a successful payment.</p></div></div></div><label>Google Drive Link / Direct File URL*<input value={form.delivery_url} onChange={e=>update('delivery_url',e.target.value)} placeholder="https://drive.google.com/... or https://cdn.../file.pdf"/><small>Use a customer-accessible file/folder link. This is the primary delivery asset.</small></label><label>Direct Download / Backup URL <span className={styles.help}>Optional</span><input value={form.backup_url} onChange={e=>update('backup_url',e.target.value)} placeholder="https://cdn.../downloads/product.pdf"/></label><label>Customer Access Instructions / Notes<textarea rows="4" value={form.access_instructions} onChange={e=>update('access_instructions',e.target.value)} placeholder="Example: Password to open the PDF is your order number. For issues, contact support…"/></label></section>

        <section className={styles.card}><div className={styles.cardHead}><div><span className={styles.step}>04</span><div><h2>Product Images</h2><p>Use the cover plus interior pages, screenshots or previews.</p></div></div><button type="button" className={styles.outline} onClick={addImage}><Plus size={15}/> Add URL</button></div><div className={styles.uploadHint}><UploadCloud size={22}/><b>Image upload / URL input</b><span>Paste hosted image URLs here. Cloudinary or another CDN can be used as the image host.</span></div><div className={styles.imageList}><label>Cover Image URL<input value={form.cover_url} onChange={e=>update('cover_url',e.target.value)} placeholder="https://.../cover.jpg"/></label>{images.map((url,i)=><div className={styles.imageRow} key={i}><input value={url} onChange={e=>setImages(x=>x.map((v,n)=>n===i?e.target.value:v))} placeholder={`Preview image ${i+1} URL`}/><button type="button" onClick={()=>setImages(x=>x.filter((_,n)=>n!==i))}><Trash2 size={15}/></button></div>)}</div></section>

        <section className={styles.card}><div className={styles.cardHead}><div><span className={styles.step}>05</span><div><h2>Variants</h2><p>Add SKU, pricing and optional stock/attribute information. Useful for bundles, editions or different access options.</p></div></div><button type="button" className={styles.outline} onClick={addVariant}><Plus size={15}/> Add Variant</button></div>{variants.length===0&&<div className={styles.emptyInner}><Layers3 size={24}/><b>No variants yet</b><span>Add at least one variant if this product has multiple editions or access options.</span></div>}{variants.map((v,i)=><div className={styles.variant} key={v.id||i}><div className={styles.variantTop}><b>Variant {i+1}</b><button type="button" onClick={()=>setVariants(x=>x.filter((_,n)=>n!==i))}><Trash2 size={15}/></button></div><div className={styles.variantGrid}><label>SKU*<input value={v.sku} onChange={e=>updateVariant(i,'sku',e.target.value)} placeholder="TT-ENG-01"/></label><label>Variant Name<input value={v.name||''} onChange={e=>updateVariant(i,'name',e.target.value)} placeholder="e.g. Complete Bundle / PDF"/></label><label>Price (INR)<input type="number" min="0" value={v.price} onChange={e=>updateVariant(i,'price',e.target.value)}/></label><label>Compare at Price<input type="number" min="0" value={v.compare_at_price} onChange={e=>updateVariant(i,'compare_at_price',e.target.value)}/></label><label>Stock Inventory<input type="number" min="0" value={v.stock} onChange={e=>updateVariant(i,'stock',e.target.value)}/></label><label>Color / Shade<input value={v.color||''} onChange={e=>updateVariant(i,'color',e.target.value)} placeholder="#F57333"/></label><label>Size / Volume<input value={v.size_volume||''} onChange={e=>updateVariant(i,'size_volume',e.target.value)} placeholder="PDF, 120 pages, 100 MB"/></label><label>Material / Access Level<input value={v.material||''} onChange={e=>updateVariant(i,'material',e.target.value)} placeholder="Premium / Standard"/></label></div></div>)}</section>

        <section className={styles.card}><div className={styles.cardHead}><div><span className={styles.step}>06</span><div><h2>Specifications</h2><p>Flexible key/value fields displayed on the product information area.</p></div></div></div>{form.specifications.map((s,i)=><div className={styles.specRow} key={i}><input value={s.key} onChange={e=>updateSpec(i,'key',e.target.value)} placeholder="Specification e.g. Format"/><input value={s.value} onChange={e=>updateSpec(i,'value',e.target.value)} placeholder="Value e.g. PDF"/><button type="button" onClick={()=>removeSpec(i)}><X size={15}/></button></div>)}<div className={styles.specRow}><input value={newSpec.key} onChange={e=>setNewSpec(x=>({...x,key:e.target.value}))} placeholder="Specification name"/><input value={newSpec.value} onChange={e=>setNewSpec(x=>({...x,value:e.target.value}))} placeholder="Specification value"/><button type="button" className={styles.addSpec} onClick={addSpec}><Plus size={16}/></button></div></section>
      </div>

      <aside className={styles.sidebar}><div className={styles.sticky}><div className={styles.previewCard}><div className={styles.previewLabel}>LIVE PRODUCT PAGE PREVIEW</div><div className={styles.previewImage}>{form.cover_url?<img src={form.cover_url} alt=""/>:<ImagePlus size={30}/>}</div><span className={styles.previewBrand}>{form.brand||'TALEEM TECH'}</span><h3>{form.title||'Your digital product'}</h3><p>Category: {categories.find(c=>c.id===form.category_id)?.name||'Uncategorized'}</p><div className={styles.previewPrice}><strong>{money(form.price)}</strong>{Number(form.compare_at_price)>Number(form.price)&&<del>{money(form.compare_at_price)}</del>}</div><div className={styles.previewThumbs}>{gallery.slice(0,4).map((src,i)=><img key={i} src={src} alt=""/> )}</div></div><div className={styles.checklist}><b>Listing checklist</b><span className={form.title?styles.ok:''}>✓ Product name</span><span className={form.category_id?styles.ok:''}>✓ Category</span><span className={form.price?styles.ok:''}>✓ Pricing</span><span className={form.cover_url?styles.ok:''}>✓ Cover image</span><span className={form.delivery_url?styles.ok:''}>✓ Delivery asset</span></div><button className={styles.saveBottom} type="submit" disabled={saving}><Save size={17}/>{saving?'Saving product…':'Save Product'}</button></div></aside>
    </form>
  </main>
}
