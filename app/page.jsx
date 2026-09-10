import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Download, GraduationCap, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './home.module.css'

export const revalidate = 30

export default async function Home() {
  const { data: products } = await supabase
    .from('products')
    .select('id,title,slug,description,price,compare_at_price,cover_url,pages,featured,categories(name)')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroGrid}>
            <div>
              <span className={styles.eyebrow}><Sparkles size={14} /> TALEEM TECH DIGITAL LEARNING STORE</span>
              <h1>Learn practical skills.<span>Build your digital confidence.</span></h1>
              <p className={styles.lead}>Affordable, practical computer e-books for students, beginners and everyday learners. Learn step by step and keep your resources in your private digital library.</p>
              <div className={styles.actions}>
                <Link href="/ebooks" className={styles.primary}>Explore E-Books <ArrowRight size={17} /></Link>
                <Link href="/register" className={styles.secondary}>Create Free Account</Link>
              </div>
              <div className={styles.trust}>
                <span><ShieldCheck size={16} /> Secure checkout</span>
                <span><Download size={16} /> Digital access</span>
                <span><GraduationCap size={16} /> Student friendly</span>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.visualPanel}>
                <div className={styles.visualTop}>
                  <span className={styles.visualBadge}>FEATURED LEARNING</span>
                  <div className={styles.visualIcon}><BookOpen size={28} /></div>
                </div>
                <h2>Upgrade your computer skills with clear, practical guides.</h2>
                <p>MS Word, Excel, computer basics and more — created with real learners in mind.</p>
                <div className={styles.visualPrice}><small>E-books from</small><strong>₹79</strong></div>
                <div className={styles.bookStack} aria-hidden="true">
                  <div className={styles.miniBook}><span className={styles.miniBookIcon}><BookOpen size={18} /></span>MS Excel Master</div>
                  <div className={styles.miniBook}><span className={styles.miniBookIcon}><BookOpen size={18} /></span>MS Word Guide</div>
                  <div className={styles.miniBook}><span className={styles.miniBookIcon}><BookOpen size={18} /></span>Computer Basics</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div><span className={styles.eyebrow}>WHY TALEEM TECH</span><h2>Built around useful learning</h2><p>Simple resources, clear explanations and a straightforward buying experience.</p></div>
          </div>
          <div className={styles.benefits}>
            <Benefit icon={<BookOpen size={21} />} title="Practical E-Books" text="Learn with examples, exercises and easy-to-follow explanations." />
            <Benefit icon={<Zap size={21} />} title="Instant Digital Access" text="Your eligible purchases stay available through your private library." />
            <Benefit icon={<GraduationCap size={21} />} title="Made for Learners" text="Designed for students, beginners and everyday computer users." />
            <Benefit icon={<ShieldCheck size={21} />} title="Secure Experience" text="Account, checkout, orders and library access are connected in one store." />
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div><span className={styles.eyebrow}>OUR COLLECTION</span><h2>Start with a useful guide</h2><p>Browse the latest Taleem Tech digital learning resources.</p></div>
            <Link href="/ebooks" className={styles.viewAll}>View all E-Books <ArrowRight size={16} /></Link>
          </div>
          {products?.length ? <div className={styles.books}>{products.slice(0, 6).map(product => <ProductCard key={product.id} p={product} />)}</div> : <div className={styles.empty}><BookOpen size={34} /><h3>E-books coming soon</h3><p>We are preparing new digital learning resources.</p></div>}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.trustBar}>
            <Trust icon={<Users size={22} />} title="Student focused" text="Created for practical computer learning" />
            <Trust icon={<BookOpen size={22} />} title="Useful resources" text="Learn important digital skills" />
            <Trust icon={<Download size={22} />} title="Private library" text="Access eligible purchases in one place" />
            <Trust icon={<CheckCircle2 size={22} />} title="Learn at your pace" text="Study when it works for you" />
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.cta}`}>
        <div className={styles.sectionInner}>
          <div className={styles.ctaBox}>
            <div><span className={styles.eyebrow}>READY TO START?</span><h2>Choose your next digital skill.</h2><p>Browse the collection, open a guide, add it to your cart and continue to secure checkout.</p></div>
            <div className={styles.ctaActions}><Link href="/ebooks" className={styles.primary}>Browse E-Books <ArrowRight size={17} /></Link><Link href="/about" className={styles.secondary}>About Taleem Tech</Link></div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Benefit({ icon, title, text }) {
  return <article className={styles.benefit}><div className={styles.benefitIcon}>{icon}</div><h3>{title}</h3><p>{text}</p></article>
}

function Trust({ icon, title, text }) {
  return <div className={styles.trustItem}>{icon}<div><strong>{title}</strong><span>{text}</span></div></div>
}

function ProductCard({ p }) {
  const discount = Number(p.compare_at_price) > Number(p.price)
  return <Link className={styles.book} href={`/products/${p.slug}`}>
    <div className={styles.cover}>
      {p.cover_url ? <img src={p.cover_url} alt={`${p.title} cover`} /> : <div className={styles.miniBookIcon}><BookOpen size={38} /> </div>}
      <span className={styles.coverTag}>{p.pages ? `${p.pages} pages` : 'DIGITAL E-BOOK'}</span>
    </div>
    <div className={styles.bookBody}>
      <span className={styles.category}>{p.categories?.name || 'Computer Skills'}</span>
      <h3>{p.title}</h3>
      <p>{p.description || 'Practical, easy-to-follow digital learning guide.'}</p>
      <div className={styles.bookBottom}>
        <div className={styles.price}><strong>{money(p.price)}</strong>{discount && <del>{money(p.compare_at_price)}</del>}</div>
        <span className={styles.view}>View guide <ArrowRight size={14} /></span>
      </div>
    </div>
  </Link>
}
