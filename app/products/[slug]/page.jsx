import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, Download, FileText, ShieldCheck } from 'lucide-react'
import { notFound } from 'next/navigation'
import { supabase, money } from '@/lib/supabase'
import CartButton from '@/components/CartButton'

export const revalidate = 30

export async function generateMetadata({ params }) {
  const { data: product } = await supabase
    .from('products')
    .select('title,description,active')
    .eq('slug', params.slug)
    .eq('active', true)
    .single()

  if (!product) return { title: 'E-Book Not Found | Taleem Tech' }

  return {
    title: `${product.title} | Taleem Tech E-Books`,
    description: product.description || `Learn with ${product.title} from Taleem Tech Computer Training Centre.`
  }
}

export default async function Product({ params }) {
  const { data: product } = await supabase
    .from('products')
    .select('id,title,slug,description,price,compare_at_price,cover_url,pages,featured,category_id,categories(name)')
    .eq('slug', params.slug)
    .eq('active', true)
    .single()

  if (!product) notFound()

  let relatedQuery = supabase
    .from('products')
    .select('id,title,slug,description,price,compare_at_price,cover_url,pages,categories(name)')
    .eq('active', true)
    .neq('id', product.id)
    .limit(3)

  if (product.category_id) relatedQuery = relatedQuery.eq('category_id', product.category_id)

  let { data: related } = await relatedQuery.order('created_at', { ascending: false })

  if (!related?.length) {
    const fallback = await supabase
      .from('products')
      .select('id,title,slug,description,price,compare_at_price,cover_url,pages,categories(name)')
      .eq('active', true)
      .neq('id', product.id)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3)
    related = fallback.data || []
  }

  const hasDiscount = Number(product.compare_at_price) > Number(product.price)
  const savings = hasDiscount
    ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
    : 0

  return (
    <main>
      <section className="section">
        <div className="container">
          <nav aria-label="Breadcrumb" style={{ marginBottom: 22, fontSize: 13, color: '#6d7786' }}>
            <Link href="/">Home</Link> <span aria-hidden="true">→</span>{' '}
            <Link href="/ebooks">E-Books</Link> <span aria-hidden="true">→</span>{' '}
            <span>{product.title}</span>
          </nav>

          <div className="productPage">
            <div>
              <div className="productCover">
                {product.cover_url ? (
                  <img src={product.cover_url} alt={`${product.title} cover`} />
                ) : (
                  <BookOpen size={70} aria-hidden="true" />
                )}
              </div>
              <Link href="/ebooks" style={{ display: 'inline-flex', gap: 7, alignItems: 'center', marginTop: 14, color: '#4169b0', fontWeight: 700, fontSize: 13 }}>
                <ArrowLeft size={15} /> Back to E-Books
              </Link>
            </div>

            <div>
              <span className="eyebrow">{product.categories?.name || 'DIGITAL E-BOOK'}</span>
              {product.featured && <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 800, color: '#4169b0' }}>FEATURED</span>}
              <h1>{product.title}</h1>
              <p className="lead">{product.description || 'A practical and easy-to-follow digital learning guide.'}</p>

              <div className="featureList" aria-label="Product benefits">
                <span><CheckCircle size={18} /> Instant digital access</span>
                <span><ShieldCheck size={18} /> Secure customer library</span>
                <span><Download size={18} /> Access your purchase when available in your library</span>
              </div>

              <div className="bigPrice">
                {money(product.price)}{' '}
                {hasDiscount && <del>{money(product.compare_at_price)}</del>}
              </div>
              {savings > 0 && <p style={{ marginTop: -15, color: '#27713e', fontWeight: 700, fontSize: 13 }}>Save {savings}% today</p>}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '20px 0 12px' }}>
                <CartButton product={product} />
                <Link href="/ebooks" className="btn">Continue Shopping <ArrowRight size={16} /></Link>
              </div>
              <p className="muted">Checkout is created securely after you sign in.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 25 }}>
                <div className="summary" style={{ padding: 15 }}>
                  <FileText size={18} />
                  <small style={{ display: 'block', marginTop: 7, color: '#788293' }}>Format</small>
                  <b>Digital e-book</b>
                </div>
                {product.pages ? (
                  <div className="summary" style={{ padding: 15 }}>
                    <BookOpen size={18} />
                    <small style={{ display: 'block', marginTop: 7, color: '#788293' }}>Pages</small>
                    <b>{product.pages}</b>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 55 }}>
            <div className="sectionHead">
              <div>
                <span className="eyebrow">PRODUCT DETAILS</span>
                <h2>About this e-book</h2>
              </div>
            </div>
            <div className="prose">
              <p>{product.description || 'This digital learning resource is designed to make computer learning easier and more practical.'}</p>
              <p><strong>Suitable for:</strong> Students, beginners and everyday computer users.</p>
              <p><strong>Access:</strong> After a successful paid order, eligible purchases are made available through your private library.</p>
              {product.pages && <p><strong>Pages:</strong> {product.pages}</p>}
            </div>
          </div>

          {related.length > 0 && (
            <div style={{ marginTop: 55 }}>
              <div className="sectionHead">
                <div>
                  <span className="eyebrow">KEEP LEARNING</span>
                  <h2>Related E-Books</h2>
                </div>
                <Link href="/ebooks" className="sectionLink">View all <ArrowRight size={16} /></Link>
              </div>
              <div className="grid">
                {related.map((item) => (
                  <Link className="card" href={`/products/${item.slug}`} key={item.id}>
                    <div className="cover">
                      {item.cover_url ? <img src={item.cover_url} alt={`${item.title} cover`} /> : <BookOpen size={42} aria-hidden="true" />}
                      {item.pages && <span>{item.pages} pages</span>}
                    </div>
                    <div className="cardBody">
                      <small>{item.categories?.name || 'Computer Skills'}</small>
                      <h3>{item.title}</h3>
                      <p>{item.description || 'Practical digital learning guide.'}</p>
                      <div className="price">
                        <b>{money(item.price)}</b>
                        {Number(item.compare_at_price) > Number(item.price) && <del>{money(item.compare_at_price)}</del>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
