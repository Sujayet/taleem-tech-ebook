import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Download, FileText, LockKeyhole, MessageCircle, PackageCheck, ShieldCheck, Sparkles, Star, Users, Zap } from 'lucide-react'
import { notFound } from 'next/navigation'
import { supabase, money } from '@/lib/supabase'
import CartButton from '@/components/CartButton'
import ProductGallery from '@/components/ProductGallery'
import styles from './product.module.css'

export const revalidate = 30

export async function generateMetadata({ params }) {
  const { data: product } = await supabase.from('products').select('title,description,active').eq('slug', params.slug).eq('active', true).single()
  if (!product) return { title: 'Digital Product Not Found | Taleem Tech' }
  return { title: `${product.title} | Taleem Tech Digital Store`, description: product.description || `Explore ${product.title} from Taleem Tech Digital Store.` }
}

export default async function Product({ params }) {
  const { data: product, error: productError } = await supabase.from('products').select('id,title,slug,description,price,compare_at_price,cover_url,pages,featured,category_id,categories(name)').eq('slug', params.slug).eq('active', true).single()
  if (productError || !product) notFound()

  const { data: galleryRow, error: galleryError } = await supabase.from('products').select('image_urls').eq('id', product.id).maybeSingle()
  const imageUrls = !galleryError && Array.isArray(galleryRow?.image_urls) ? galleryRow.image_urls : []

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
          <Link href="/">Home</Link><span>›</span><Link href="/ebooks">Digital Products</Link><span>›</span><span>{product.title}</span>
        </nav>

        <section className={styles.layout}>
          <div className={styles.coverWrap}>
            <ProductGallery title={product.title} coverUrl={product.cover_url} imageUrls={imageUrls} />
            <div className={styles.galleryHint}><Sparkles size={14} /> Preview the product gallery before you buy</div>
          </div>

          <div className={styles.purchaseColumn}>
            <div className={styles.labelRow}><span className={styles.eyebrow}><Sparkles size={13} /> {product.categories?.name || 'Digital Product'}</span>{product.featured && <span className={styles.featured}>FEATURED</span>}</div>
            <h1 className={styles.title}>{product.title}</h1>
            <div className={styles.ratingRow}><span className={styles.stars}><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></span><span>Reviews coming from verified customers</span></div>
            <p className={styles.lead}>{product.description || 'A practical and easy-to-follow digital resource designed for useful learning, confident computer skills and everyday productivity.'}</p>

            <div className={styles.accessBanner}><div className={styles.accessIcon}><Zap size={20} /></div><div><strong>Instant digital access</strong><span>After a successful purchase, your eligible product is added to your private library.</span></div></div>

            <div className={styles.buyBox}>
              <div className={styles.priceRow}><span className={styles.price}>{money(product.price)}</span>{hasDiscount && <del className={styles.oldPrice}>{money(product.compare_at_price)}</del>}{savings > 0 && <span className={styles.saving}>Save {savings}%</span>}</div>
              <div className={styles.actions}><CartButton product={product} /><Link href="/ebooks" className="btn">Continue Shopping <ArrowRight size={16} /></Link></div>
              <p className={styles.note}><LockKeyhole size={13} /> Secure checkout · Digital delivery · No physical shipping</p>
            </div>

            <div className={styles.quickSpecs}>
              <div><FileText size={18} /><span><small>Product type</small><b>Digital e-book</b></span></div>
              <div><BookOpen size={18} /><span><small>Length</small><b>{product.pages ? `${product.pages} pages` : 'Digital guide'}</b></span></div>
              <div><Download size={18} /><span><small>Delivery</small><b>Instant access</b></span></div>
              <div><Users size={18} /><span><small>Access</small><b>Your private library</b></span></div>
            </div>
          </div>
        </section>

        <section className={styles.valueStrip} aria-label="Purchase benefits"><div><PackageCheck size={19} /><span><b>Instant delivery</b><small>No waiting for shipping</small></span></div><div><ShieldCheck size={19} /><span><b>Secure purchase</b><small>Protected checkout flow</small></span></div><div><Download size={19} /><span><b>Private library</b><small>Find eligible purchases in one place</small></span></div><div><Clock3 size={19} /><span><b>Learn anytime</b><small>Access your digital shelf when needed</small></span></div></section>

        <section className={styles.details}>
          <div className={styles.sectionHead}><div><span className={styles.eyebrow}>PRODUCT DETAILS</span><h2>What you are getting</h2></div></div>
          <div className={styles.detailGrid}>
            <article className={styles.detailCard}><div className={styles.detailIcon}><BookOpen size={20} /></div><h3>Practical digital learning</h3><p>{product.description || 'A structured digital resource created to make learning easier to follow and apply.'}</p></article>
            <article className={styles.detailCard}><div className={styles.detailIcon}><Download size={20} /></div><h3>Instant access</h3><p>Once your payment is successfully completed, eligible purchases are connected to your account library.</p></article>
            <article className={styles.detailCard}><div className={styles.detailIcon}><ShieldCheck size={20} /></div><h3>Keep it in your library</h3><p>Sign in to your account whenever you want to find your eligible digital purchases in one place.</p></article>
          </div>
          <div className={styles.prose}><h3>About this product</h3><p>{product.description || 'This digital learning resource is designed to make computer learning more practical, understandable and easy to follow.'}</p><div className={styles.infoRows}><div><strong>Best for</strong><span>Students, beginners and everyday digital learners</span></div><div><strong>Format</strong><span>Digital e-book / downloadable learning resource</span></div>{product.pages && <div><strong>Pages</strong><span>{product.pages} pages</span></div>}<div><strong>Delivery</strong><span>Instant access to eligible purchases after successful checkout</span></div></div></div>
        </section>

        <section className={styles.reviewSection}>
          <div><span className={styles.eyebrow}>CUSTOMER REVIEWS</span><h2>Real experiences, not made-up testimonials.</h2><p>Customer reviews will appear here as verified buyers share their experience with this product.</p></div>
          <div className={styles.reviewEmpty}><div className={styles.reviewStars}><Star size={17} /><Star size={17} /><Star size={17} /><Star size={17} /><Star size={17} /></div><strong>Be one of the first to review this product.</strong><span>Purchased this product? Share what you found useful and help the next learner.</span><Link href="/contact" className="btn"><MessageCircle size={15} /> Share feedback</Link></div>
        </section>

        {related.length > 0 && <section className={styles.related}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>KEEP EXPLORING</span><h2>Related digital products</h2></div><Link href="/ebooks" className={styles.viewAll}>View all <ArrowRight size={16} /></Link></div><div className={styles.relatedGrid}>{related.map((item) => <Link className={styles.relatedCard} href={`/products/${item.slug}`} key={item.id}><div className={styles.relatedCover}>{item.cover_url ? <img src={item.cover_url} alt={`${item.title} cover`} /> : <BookOpen size={42} />}{item.pages && <span className={styles.pages}>{item.pages} pages</span>}</div><div className={styles.relatedBody}><small>{item.categories?.name || 'Digital Product'}</small><h3>{item.title}</h3><p>{item.description || 'Practical digital learning resource.'}</p><div className={styles.relatedPrice}><b>{money(item.price)}</b>{Number(item.compare_at_price) > Number(item.price) && <del>{money(item.compare_at_price)}</del>}</div></div></Link>)}</div></section>}
      </div>
    </main>
  )
}
