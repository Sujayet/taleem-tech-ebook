import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, Download, FileText, ShieldCheck, Sparkles } from 'lucide-react'
import { notFound } from 'next/navigation'
import { supabase, money } from '@/lib/supabase'
import CartButton from '@/components/CartButton'
import ProductGallery from '@/components/ProductGallery'
import styles from './product.module.css'

export const revalidate = 30

export async function generateMetadata({ params }) {
  const { data: product } = await supabase.from('products').select('title,description,active').eq('slug', params.slug).eq('active', true).single()
  if (!product) return { title: 'E-Book Not Found | Taleem Tech' }
  return { title: `${product.title} | Taleem Tech E-Books`, description: product.description || `Learn with ${product.title} from Taleem Tech Computer Training Centre.` }
}

export default async function Product({ params }) {
  const { data: product, error: productError } = await supabase.from('products').select('id,title,slug,description,price,compare_at_price,cover_url,pages,featured,category_id,categories(name)').eq('slug', params.slug).eq('active', true).single()
  if (productError || !product) notFound()

  const { data: galleryRow } = await supabase.from('products').select('image_urls').eq('id', product.id).maybeSingle()
  const imageUrls = Array.isArray(galleryRow?.image_urls) ? galleryRow.image_urls : []

  let relatedQuery = supabase.from('products').select('id,title,slug,description,price,compare_at_price,cover_url,pages,categories(name)').eq('active', true).neq('id', product.id).limit(3)
  if (product.category_id) relatedQuery = relatedQuery.eq('category_id', product.category_id)
  let { data: related } = await relatedQuery.order('created_at', { ascending: false })
  if (!related?.length) {
    const fallback = await supabase.from('products').select('id,title,slug,description,price,compare_at_price,cover_url,pages,categories(name)').eq('active', true).neq('id', product.id).order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(3)
    related = fallback.data || []
  }

  const hasDiscount = Number(product.compare_at_price) > Number(product.price)
  const savings = hasDiscount ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100) : 0

  return (
    <main className={styles.page}>
      <div className="container">
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>›</span><Link href="/ebooks">E-Books</Link><span>›</span><span>{product.title}</span>
        </nav>
        <section className={styles.layout}>
          <div className={styles.coverWrap}>
            <ProductGallery title={product.title} coverUrl={product.cover_url} imageUrls={imageUrls} />
            <Link href="/ebooks" className={styles.back}><ArrowLeft size={15} /> Back to E-Books</Link>
          </div>
          <div>
            <div><span className={styles.eyebrow}><Sparkles size={13} /> {product.categories?.name || 'Digital E-Book'}</span>{product.featured && <span className={styles.featured}>FEATURED</span>}</div>
            <h1 className={styles.title}>{product.title}</h1>
            <p className={styles.lead}>{product.description || 'A practical and easy-to-follow digital learning guide designed for confident, useful computer learning.'}</p>
            <div className={styles.benefits} aria-label="Product benefits">
              <span className={styles.benefit}><CheckCircle size={18} /> Instant digital access after a successful purchase</span>
              <span className={styles.benefit}><ShieldCheck size={18} /> Secure customer library for your purchased guides</span>
              <span className={styles.benefit}><Download size={18} /> Keep access to eligible purchases from your library</span>
            </div>
            <div className={styles.buyBox}>
              <div className={styles.priceRow}><span className={styles.price}>{money(product.price)}</span>{hasDiscount && <del className={styles.oldPrice}>{money(product.compare_at_price)}</del>}</div>
              {savings > 0 && <span className={styles.saving}>Save {savings}% today</span>}
              <div className={styles.actions}><CartButton product={product} /><Link href="/ebooks" className="btn">Continue Shopping <ArrowRight size={16} /></Link></div>
              <p className={styles.note}>Checkout is created securely after you sign in.</p>
              <div className={styles.specs}><div className={styles.spec}><FileText size={18} className={styles.specIcon} /><small>Format</small><b>Digital e-book</b></div><div className={styles.spec}><BookOpen size={18} className={styles.specIcon} /><small>Length</small><b>{product.pages ? `${product.pages} pages` : 'Digital guide'}</b></div></div>
            </div>
          </div>
        </section>
        <section className={styles.details}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>PRODUCT DETAILS</span><h2>About this e-book</h2></div></div><div className={styles.prose}><p>{product.description || 'This digital learning resource is designed to make computer learning easier, more practical, and easier to follow.'}</p><p><strong>Suitable for:</strong> Students, beginners and everyday computer users.</p><p><strong>Access:</strong> After a successful paid order, eligible purchases are made available through your private library.</p>{product.pages && <p><strong>Pages:</strong> {product.pages}</p>}</div></section>
        {related.length > 0 && <section className={styles.related}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>KEEP LEARNING</span><h2>Related E-Books</h2></div><Link href="/ebooks" className={styles.viewAll}>View all <ArrowRight size={16} /></Link></div><div className={styles.relatedGrid}>{related.map((item) => <Link className={styles.relatedCard} href={`/products/${item.slug}`} key={item.id}><div className={styles.relatedCover}>{item.cover_url ? <img src={item.cover_url} alt={`${item.title} cover`} /> : <BookOpen size={42} />}{item.pages && <span className={styles.pages}>{item.pages} pages</span>}</div><div className={styles.relatedBody}><small>{item.categories?.name || 'Computer Skills'}</small><h3>{item.title}</h3><p>{item.description || 'Practical digital learning guide.'}</p><div className={styles.relatedPrice}><b>{money(item.price)}</b>{Number(item.compare_at_price) > Number(item.price) && <del>{money(item.compare_at_price)}</del>}</div></div></Link>)}</div></section>}
      </div>
    </main>
  )
}
