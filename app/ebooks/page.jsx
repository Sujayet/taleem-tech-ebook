import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Search, Sparkles, SlidersHorizontal } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './ebooks.module.css'

export default async function Ebooks({ searchParams }) {
  const q = searchParams?.q?.trim() || ''
  const cat = searchParams?.category || ''

  let query = supabase
    .from('products')
    .select('id,title,slug,description,price,compare_at_price,cover_url,pages,categories(id,name,slug)')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (q) query = query.ilike('title', `%${q}%`)

  const [{ data: products, error: productsError }, { data: cats }] = await Promise.all([
    query,
    supabase.from('categories').select('id,name,slug').order('name'),
  ])

  const books = products || []
  const categories = cats || []
  const getCategory = (product) => Array.isArray(product.categories) ? product.categories[0] : product.categories
  const shown = cat ? books.filter((product) => getCategory(product)?.slug === cat) : books
  const activeCategory = categories.find((category) => category.slug === cat)

  return (
    <section className={`${styles.page} section`}>
      <div className="container">
        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}><Sparkles size={14} /> TALEEM TECH CATALOGUE</span>
            <h1>Learn smarter.<br /><span>Build with confidence.</span></h1>
            <p>Practical e-books designed to help students, beginners, and everyday computer users learn useful skills faster.</p>
            <div className={styles.trust}>
              <span><CheckCircle2 size={16} /> Instant digital access</span>
              <span><CheckCircle2 size={16} /> Practical learning</span>
              <span><CheckCircle2 size={16} /> Learn at your pace</span>
            </div>
          </div>
          <div className={styles.heroCard}>
            <div className={styles.heroIcon}><BookOpen size={28} /></div>
            <span>EXPLORE THE LIBRARY</span>
            <strong>{books.length} {books.length === 1 ? 'e-book' : 'e-books'}</strong>
            <p>Choose a topic, open the guide, and start learning today.</p>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div>
            <span className={styles.eyebrow}>BROWSE COLLECTION</span>
            <h2>{activeCategory ? activeCategory.name : 'All E-Books'}</h2>
            <p>{shown.length} {shown.length === 1 ? 'title' : 'titles'} available</p>
          </div>
          <form className={styles.searchForm} action="/ebooks">
            <div className="search">
              <Search size={18} />
              <input name="q" defaultValue={q} placeholder="Search by e-book title..." aria-label="Search e-books" />
            </div>
            <select name="category" defaultValue={cat} aria-label="Filter by category">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
            </select>
            <button className="btn primary" type="submit"><SlidersHorizontal size={16} /> Search</button>
          </form>
        </div>

        {categories.length > 0 && (
          <div className={styles.chips} aria-label="E-book categories">
            <Link className={!cat ? styles.active : ''} href="/ebooks">All</Link>
            {categories.map((category) => (
              <Link key={category.id} className={cat === category.slug ? styles.active : ''} href={`/ebooks?category=${encodeURIComponent(category.slug)}`}>
                {category.name}
              </Link>
            ))}
          </div>
        )}

        {productsError ? (
          <div className={`empty ${styles.empty}`}>
            <BookOpen size={34} />
            <h3>We couldn't load the catalogue.</h3>
            <p>Please refresh the page and try again.</p>
          </div>
        ) : shown.length > 0 ? (
          <div className={styles.grid}>
            {shown.map((product) => {
              const category = getCategory(product)
              return (
                <Link className={styles.card} key={product.id} href={`/products/${product.slug}`}>
                  <div className={styles.cover}>
                    {product.cover_url ? (
                      <img src={product.cover_url} alt={`${product.title} cover`} />
                    ) : (
                      <div className={styles.fallback}><BookOpen size={44} /><span>Taleem Tech</span></div>
                    )}
                    <span className={styles.badge}>{product.pages ? `${product.pages} pages` : 'PDF'}</span>
                    {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                      <span className={styles.sale}>SPECIAL PRICE</span>
                    )}
                  </div>
                  <div className={styles.body}>
                    <div className={styles.meta}>
                      <span>{category?.name || 'E-Book'}</span>
                      <ArrowRight size={15} />
                    </div>
                    <h3>{product.title}</h3>
                    <p>{product.description || 'Practical computer learning guide.'}</p>
                    <div className={styles.footer}>
                      <div className="price"><b>{money(product.price)}</b>{product.compare_at_price && <del>{money(product.compare_at_price)}</del>}</div>
                      <span className={styles.view}>View guide <ArrowRight size={15} /></span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className={`empty ${styles.empty}`}>
            <Search size={34} />
            <h3>No e-books found</h3>
            <p>Try a different title or browse all categories.</p>
            <Link className="btn primary" href="/ebooks">View all e-books</Link>
          </div>
        )}
      </div>
    </section>
  )
}
