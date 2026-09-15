import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Download, GraduationCap, Layers3, LockKeyhole, MessageCircle, PlayCircle, Sparkles, Star, Target, Zap } from 'lucide-react'
import { supabase, money } from '@/lib/supabase'
import styles from './discover/discover.module.css'

export const revalidate = 30

const categoryIcons = [BookOpen, Layers3, Sparkles, Target, GraduationCap, Zap]

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
              <span className={styles.eyebrow}><Sparkles size={14} /> TALEEM TECH LEARNING EXPERIENCE</span>
              <h1>Turn curiosity into <span>real digital skills.</span></h1>
              <p>Discover practical e-books, focused learning paths and resources built for students, beginners and ambitious everyday learners.</p>
              <div className={styles.actions}>
                <Link href="/ebooks" className={styles.primary}>Explore E-Books <ArrowRight size={17} /></Link>
                <Link href="#how" className={styles.secondary}><PlayCircle size={17} /> How it works</Link>
              </div>
              <div className={styles.trustRow}>
                <span><CheckCircle2 size={15} /> Instant access</span><span><LockKeyhole size={15} /> Secure checkout</span><span><Download size={15} /> Private library</span>
              </div>
            </div>
            <div className={styles.heroStage} aria-label="Learning dashboard preview">
              <div className={styles.glowCard}>
                <div className={styles.stageHeader}><span>YOUR LEARNING SPACE</span><span className={styles.liveDot}>LIVE</span></div>
                <div className={styles.progressBlock}><div><small>Current focus</small><strong>Computer Skills</strong></div><div className={styles.progressRing}><span>72%</span></div></div>
                <div className={styles.skillRows}><div><BookOpen size={17} /><span>MS Office Essentials</span><b>86%</b></div><div><Layers3 size={17} /><span>Web Development</span><b>64%</b></div><div><Target size={17} /><span>Digital Productivity</span><b>48%</b></div></div>
                <div className={styles.floatingBadge}><Zap size={16} /> Learn something useful today</div>
              </div>
            </div>
          </div>
          <div className={styles.stats}><div><b>10K+</b><span>Learners reached</span></div><div><b>{books.length || '50'}+</b><span>Guides in the store</span></div><div><b>{cats.length || '8'}+</b><span>Learning categories</span></div><div><b>★★★★★</b><span>Built for learners</span></div></div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionIntro}><span className={styles.eyebrow}>EXPLORE YOUR INTERESTS</span><h2>Find a skill worth learning.</h2><p>Jump into a topic and discover resources that turn screen time into progress.</p></div>
          <div className={styles.categoryGrid}>{visibleCats.map((cat, i) => { const Icon = categoryIcons[i % categoryIcons.length]; return <Link href={`/ebooks?category=${cat.slug || ''}`} className={styles.category} key={cat.id}><span className={styles.categoryIcon}><Icon size={21} /></span><div><strong>{cat.name}</strong><span>Explore guides</span></div><ArrowRight size={16} /></Link> })}</div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.lightBand}`} id="how">
        <div className="container"><div className={styles.sectionIntro}><span className={styles.eyebrow}>A BETTER WAY TO LEARN</span><h2>From search to skill in three simple moves.</h2></div><div className={styles.steps}><Step n="01" icon={<Target size={22} />} title="Choose your goal" text="Find a guide that matches the skill you want to improve right now." /><Step n="02" icon={<BookOpen size={22} />} title="Learn your way" text="Open clear, practical material and move at a pace that feels comfortable." /><Step n="03" icon={<GraduationCap size={22} />} title="Keep growing" text="Return to your private library whenever you are ready for the next step." /></div></div>
      </section>

      <section className={styles.featureSection}>
        <div className="container"><div className={styles.featureHead}><div><span className={styles.eyebrow}>HANDPICKED FOR YOU</span><h2>Popular learning guides.</h2><p>Fresh, useful resources from the Taleem Tech collection.</p></div><Link href="/ebooks" className={styles.textLink}>View all <ArrowRight size={15} /></Link></div><div className={styles.bookGrid}>{books.map(book => <Link href={`/products/${book.slug}`} className={styles.bookCard} key={book.id}><div className={styles.cover}>{book.cover_url ? <img src={book.cover_url} alt={`${book.title} cover`} /> : <div className={styles.coverFallback}><BookOpen size={34} /><span>TALEEM TECH</span></div>}<span>{book.pages ? `${book.pages} pages` : 'DIGITAL E-BOOK'}</span></div><div className={styles.bookBody}><small>{book.categories?.name || 'Computer Skills'}</small><h3>{book.title}</h3><p>{book.description || 'Practical learning guide for everyday digital skills.'}</p><div className={styles.bookFooter}><div><b>{money(book.price)}</b>{book.compare_at_price && Number(book.compare_at_price) > Number(book.price) ? <del>{money(book.compare_at_price)}</del> : null}</div><span><Star size={13} fill="currentColor" /> Learn</span></div></div></Link>)}</div></div>
      </section>

      <section className={styles.section}>
        <div className="container"><div className={styles.featureHead}><div><span className={styles.eyebrow}>LEARNER FEEDBACK</span><h2>Reviews that belong to real learners.</h2><p>We are building this section around genuine customer feedback — no made-up testimonials. Purchased learners will be able to share their experience as reviews are added to the store.</p></div><Link href="/contact" className={styles.textLink}><MessageCircle size={15} /> Share feedback <ArrowRight size={15} /></Link></div><div className={styles.bookGrid}><article className={styles.bookCard}><div className={styles.bookBody}><span className={styles.eyebrow}>★★★★★</span><h3>Your experience matters</h3><p>Tell us what you learned, what helped you most and how we can make the next guide even better.</p><div className={styles.bookFooter}><span>Verified learner feedback</span><MessageCircle size={17} /></div></div></article><article className={styles.bookCard}><div className={styles.bookBody}><span className={styles.eyebrow}>★★★★★</span><h3>Useful, practical, clear</h3><p>Our goal is to make computer learning less intimidating and more useful for students and beginners.</p><div className={styles.bookFooter}><span>Our learning promise</span><GraduationCap size={17} /></div></div></article><article className={styles.bookCard}><div className={styles.bookBody}><span className={styles.eyebrow}>★★★★★</span><h3>Help us improve</h3><p>Have a suggestion for an e-book, topic or learning feature? We want to hear it.</p><div className={styles.bookFooter}><span>Open to suggestions</span><Zap size={17} /></div></div></article></div></div>
      </section>

      <section className={styles.darkSection}><div className="container"><div className={styles.darkGrid}><div><span className={styles.eyebrow}>WHY TALEEM TECH</span><h2>More than an e-book store. A place to keep moving forward.</h2><p>We combine accessible pricing, practical content and a simple digital library so learning feels less complicated and more achievable.</p><Link href="/about" className={styles.secondaryDark}>Discover our story <ArrowRight size={16} /></Link></div><div className={styles.benefitGrid}><Benefit icon={<Zap size={20} />} title="Instant access" text="Get started as soon as your purchase is complete." /><Benefit icon={<LockKeyhole size={20} />} title="Trusted learning" text="A focused collection made for real learners." /><Benefit icon={<Download size={20} />} title="Private library" text="Keep eligible purchases organized in one place." /><Benefit icon={<GraduationCap size={20} />} title="Learn at your pace" text="Build confidence one useful topic at a time." /></div></div></div></section>

      <section className={styles.section}>
        <div className="container"><div className={styles.sectionIntro}><span className={styles.eyebrow}>QUICK ANSWERS</span><h2>Everything you need to know.</h2></div><div className={styles.categoryGrid}><Faq title="What do I get after purchase?" text="Eligible digital purchases are made available through your private library after checkout." /><Faq title="Can I learn on my phone?" text="Yes. The store and digital learning experience are designed to work across modern phones, tablets and computers." /><Faq title="Who are the e-books for?" text="They are designed especially for students, beginners and anyone who wants practical computer skills." /><Faq title="How do I find the right guide?" text="Browse categories, explore the collection, or contact Taleem Tech if you need help choosing a topic." /></div></div>
      </section>

      <section className={styles.finalCta}><div className="container"><div className={styles.ctaBox}><div><span className={styles.eyebrow}>YOUR NEXT CHAPTER</span><h2>One useful guide can change what you can do.</h2><p>Start with a topic you care about and make your next learning session count.</p></div><Link href="/ebooks" className={styles.primary}>Start Learning <ArrowRight size={17} /></Link></div></div></section>
    </main>
  )
}

function Step({ n, icon, title, text }) { return <article className={styles.step}><span>{n}</span><div className={styles.stepIcon}>{icon}</div><h3>{title}</h3><p>{text}</p></article> }
function Benefit({ icon, title, text }) { return <article className={styles.benefit}><div>{icon}</div><h3>{title}</h3><p>{text}</p></article> }
function Faq({ title, text }) { return <details className={styles.category}><summary><strong>{title}</strong><ArrowRight size={16} /></summary><p>{text}</p></details> }
