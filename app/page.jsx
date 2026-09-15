import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Download, FileText, GraduationCap, Layers3, LayoutTemplate, LockKeyhole, MessageCircle, PlayCircle, Sparkles, Star, Target, WandSparkles, Zap } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './discover/discover.module.css'

export const revalidate = 30

const categoryIcons = [BookOpen, Layers3, Sparkles, Target, GraduationCap, Zap]
const productFormats = [
  { icon: BookOpen, title: 'E-Books & Guides', text: 'Practical knowledge in a ready-to-read format.' },
  { icon: FileText, title: 'Notes & Study Material', text: 'Focused resources for faster revision and learning.' },
  { icon: LayoutTemplate, title: 'Templates & Documents', text: 'Ready-to-use files that save time and effort.' },
  { icon: WandSparkles, title: 'Creative Resources', text: 'Digital assets for design, content and projects.' },
  { icon: GraduationCap, title: 'Courses & Learning', text: 'Structured digital learning for new skills.' },
  { icon: Zap, title: 'Productivity Tools', text: 'Useful digital resources for everyday work.' },
]

export default async function Home() {
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('id,title,slug,description,price,compare_at_price,cover_url,pages,featured,categories(name,slug)').eq('active', true).order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(6),
    supabase.from('categories').select('id,name,slug').order('name').limit(8),
  ])

  const books = products || []
  const cats = categories || []
  const visibleCats = cats.length ? cats : [
    { id: 1, name: 'Computer Skills', slug: 'computer-skills' },
    { id: 2, name: 'Programming', slug: 'programming' },
    { id: 3, name: 'Design & Creativity', slug: 'design-creativity' },
    { id: 4, name: 'Business', slug: 'business' },
    { id: 5, name: 'Academic Learning', slug: 'academic-learning' },
    { id: 6, name: 'Personal Development', slug: 'personal-development' },
  ]

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.orb} />
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}><Sparkles size={14} /> TALEEM TECH DIGITAL STORE</span>
              <h1>Everything digital. <span>Ready when you are.</span></h1>
              <p>Discover e-books, study resources, templates, creative assets and other useful digital products — purchase once and get eligible products instantly.</p>
              <div className={styles.actions}>
                <Link href="/ebooks" className={styles.primary}>Shop Digital Products <ArrowRight size={17} /></Link>
                <Link href="#how" className={styles.secondary}><PlayCircle size={17} /> How it works</Link>
              </div>
              <div className={styles.trustRow}>
                <span><CheckCircle2 size={15} /> Instant delivery</span><span><LockKeyhole size={15} /> Secure checkout</span><span><Download size={15} /> Private library</span>
              </div>
            </div>
            <div className={styles.heroStage} aria-label="Instant digital access preview">
              <div className={styles.glowCard}>
                <div className={styles.stageHeader}><span>YOUR DIGITAL SHELF</span><span className={styles.liveDot}>READY</span></div>
                <div className={styles.progressBlock}><div><small>After checkout</small><strong>Access instantly</strong></div><div className={styles.progressRing}><span>100%</span></div></div>
                <div className={styles.skillRows}>
                  <div><BookOpen size={17} /><span>Learning Guides</span><b>OPEN</b></div>
                  <div><LayoutTemplate size={17} /><span>Templates & Resources</span><b>OPEN</b></div>
                  <div><Download size={17} /><span>Your Private Library</span><b>READY</b></div>
                </div>
                <div className={styles.floatingBadge}><Zap size={16} /> Buy once. Access instantly.</div>
              </div>
            </div>
          </div>
          <div className={styles.stats}><div><b>{books.length}</b><span>Featured products</span></div><div><b>{cats.length}</b><span>Store categories</span></div><div><b>24/7</b><span>Access your library</span></div><div><b>★★★★★</b><span>Review-ready experience</span></div></div>
        </div>
      </section>

      <section className={styles.section} id="formats">
        <div className="container">
          <div className={styles.sectionIntro}><span className={styles.eyebrow}>ONE STORE, MANY FORMATS</span><h2>More than just e-books.</h2><p>Build the store around every kind of digital product your customers may want to buy and access online.</p></div>
          <div className={styles.formatGrid}>{productFormats.map(({ icon: Icon, title, text }) => <Link href="/ebooks" className={styles.formatCard} key={title}><span className={styles.formatIcon}><Icon size={21} /></span><div><strong>{title}</strong><span>{text}</span></div><ArrowRight size={16} /></Link>)}</div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionIntro}><span className={styles.eyebrow}>EXPLORE YOUR INTERESTS</span><h2>Find something useful.</h2><p>Browse the store by topic and discover digital resources that turn screen time into progress.</p></div>
          <div className={styles.categoryGrid}>{visibleCats.map((cat, i) => { const Icon = categoryIcons[i % categoryIcons.length]; return <Link href={`/ebooks?category=${cat.slug || ''}`} className={styles.category} key={cat.id}><span className={styles.categoryIcon}><Icon size={21} /></span><div><strong>{cat.name}</strong><span>Explore products</span></div><ArrowRight size={16} /></Link> })}</div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.lightBand}`} id="how">
        <div className="container"><div className={styles.sectionIntro}><span className={styles.eyebrow}>SIMPLE DIGITAL DELIVERY</span><h2>From discovery to download in three moves.</h2></div><div className={styles.steps}><Step n="01" icon={<Target size={22} />} title="Choose a product" text="Explore the collection, compare options and choose the digital resource that fits your goal." /><Step n="02" icon={<LockKeyhole size={22} />} title="Checkout securely" text="Complete your purchase through the store's checkout flow with your account details." /><Step n="03" icon={<Download size={22} />} title="Access instantly" text="Eligible purchases become available in your private library so you can get started right away." /></div></div>
      </section>

      <section className={styles.featureSection} id="collection">
        <div className="container"><div className={styles.featureHead}><div><span className={styles.eyebrow}>FEATURED DIGITAL PRODUCTS</span><h2>Popular picks from the store.</h2><p>Explore the latest products currently available in the Taleem Tech collection.</p></div><Link href="/ebooks" className={styles.textLink}>View all <ArrowRight size={15} /></Link></div><div className={styles.bookGrid}>{books.map(product => <Link href={`/products/${product.slug}`} className={styles.bookCard} key={product.id}><div className={styles.cover}>{product.cover_url ? <img src={product.cover_url} alt={`${product.title} cover`} /> : <div className={styles.coverFallback}><BookOpen size={34} /><span>TALEEM TECH</span></div>}<span>{product.pages ? `${product.pages} pages` : 'DIGITAL PRODUCT'}</span></div><div className={styles.bookBody}><small>{product.categories?.name || 'Digital Product'}</small><h3>{product.title}</h3><p>{product.description || 'Useful digital resource designed for practical learning and everyday use.'}</p><div className={styles.bookFooter}><div><b>{money(product.price)}</b>{product.compare_at_price && Number(product.compare_at_price) > Number(product.price) ? <del>{money(product.compare_at_price)}</del> : null}</div><span><Star size={13} fill="currentColor" /> View</span></div></div></Link>)}</div></div>
      </section>

      <section className={styles.section}>
        <div className="container"><div className={styles.featureHead}><div><span className={styles.eyebrow}>LEARNER FEEDBACK</span><h2>Reviews that belong to real customers.</h2><p>We are building this section around genuine customer feedback — no made-up testimonials. Customers can share their experience as reviews are added to the store.</p></div><Link href="/contact" className={styles.textLink}><MessageCircle size={15} /> Share feedback <ArrowRight size={15} /></Link></div><div className={styles.bookGrid}><article className={styles.bookCard}><div className={styles.bookBody}><span className={styles.eyebrow}>★★★★★</span><h3>Your experience matters</h3><p>Tell us what you purchased, what helped you most and how we can make the next digital product even better.</p><div className={styles.bookFooter}><span>Customer feedback</span><MessageCircle size={17} /></div></div></article><article className={styles.bookCard}><div className={styles.bookBody}><span className={styles.eyebrow}>★★★★★</span><h3>Useful. Practical. Clear.</h3><p>Our goal is to make every digital resource easy to understand, useful to apply and simple to access.</p><div className={styles.bookFooter}><span>Our product promise</span><GraduationCap size={17} /></div></div></article><article className={styles.bookCard}><div className={styles.bookBody}><span className={styles.eyebrow}>★★★★★</span><h3>Help us improve</h3><p>Have an idea for a product, format or feature? Your suggestions can shape what we add next.</p><div className={styles.bookFooter}><span>Open to suggestions</span><Zap size={17} /></div></div></article></div></div>
      </section>

      <section className={styles.darkSection}><div className="container"><div className={styles.darkGrid}><div><span className={styles.eyebrow}>WHY TALEEM TECH</span><h2>A digital store built around instant access.</h2><p>Keep useful digital products, straightforward checkout and a private customer library in one clean experience — ready to grow beyond e-books.</p><Link href="/about" className={styles.secondaryDark}>Discover our story <ArrowRight size={16} /></Link></div><div className={styles.benefitGrid}><Benefit icon={<Zap size={20} />} title="Instant access" text="Get eligible digital products as soon as your purchase is complete." /><Benefit icon={<LockKeyhole size={20} />} title="Secure checkout" text="A focused checkout experience designed to keep purchasing simple." /><Benefit icon={<Download size={20} />} title="Private library" text="Keep eligible purchases organized and available from your account." /><Benefit icon={<Layers3 size={20} />} title="Made to expand" text="A flexible storefront experience for multiple digital product formats." /></div></div></div></section>

      <section className={styles.section}>
        <div className="container"><div className={styles.sectionIntro}><span className={styles.eyebrow}>QUICK ANSWERS</span><h2>Everything you need to know.</h2></div><div className={styles.categoryGrid}><Faq title="What kinds of products can I buy?" text="The storefront is designed for digital products such as e-books, study resources, templates, creative assets, courses and productivity resources. Available products appear in the collection." /><Faq title="When do I get my purchase?" text="Eligible digital purchases are made available through your private library after checkout, so you can start without waiting for physical delivery." /><Faq title="Can I access products on my phone?" text="Yes. The store and customer library are designed to work across modern phones, tablets and computers." /><Faq title="Where can I find my purchases?" text="Sign in and open My Library to view eligible digital purchases associated with your account." /></div></div>
      </section>

      <section className={styles.finalCta}><div className="container"><div className={styles.ctaBox}><div><span className={styles.eyebrow}>YOUR DIGITAL SHELF AWAITS</span><h2>Find it. Buy it. Access it instantly.</h2><p>Explore useful digital products and keep your purchases together in one private library.</p></div><Link href="/ebooks" className={styles.primary}>Explore Store <ArrowRight size={17} /></Link></div></div></section>
    </main>
  )
}

function Step({ n, icon, title, text }) { return <article className={styles.step}><span>{n}</span><div className={styles.stepIcon}>{icon}</div><h3>{title}</h3><p>{text}</p></article> }
function Benefit({ icon, title, text }) { return <article className={styles.benefit}><div>{icon}</div><h3>{title}</h3><p>{text}</p></article> }
function Faq({ title, text }) { return <details className={styles.category}><summary><strong>{title}</strong><ArrowRight size={16} /></summary><p>{text}</p></details> }
