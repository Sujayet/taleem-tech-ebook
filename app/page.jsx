import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Download,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap
} from 'lucide-react'
import { supabase, money } from '@/lib/supabase'

export const revalidate = 30

export default async function Home() {
  const { data: products } = await supabase
    .from('products')
    .select(
      'id,title,slug,description,price,compare_at_price,cover_url,pages,featured,categories(name)'
    )
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <main>

      {/* HERO */}
      <section className="hero homeHero">
        <div className="container heroGrid">

          <div className="heroContent">

            <div className="eyebrow">
              <Sparkles size={15} />
              DIGITAL LEARNING STORE
            </div>

            <h1>
              Learn smarter.
              <span> Build better digital skills.</span>
            </h1>

            <p className="heroText">
              Practical, easy-to-follow computer e-books designed for
              students, beginners and everyday learners.
            </p>

            <div className="actions">
              <Link
                className="btn primary"
                href="/ebooks"
              >
                Explore E-Books
                <ArrowRight size={18} />
              </Link>

              <Link
                className="btn ghost"
                href="/register"
              >
                Create Free Account
              </Link>
            </div>

            <div className="trust">
              <span>
                <ShieldCheck size={19} />
                Secure access
              </span>

              <span>
                <Download size={19} />
                Instant access
              </span>

              <span>
                <GraduationCap size={19} />
                Student friendly
              </span>
            </div>

          </div>

          {/* HERO CARD */}
          <div className="heroCard homeHeroCard">

            <div className="heroBookIcon">
              <BookOpen size={42} />
            </div>

            <span className="heroCardLabel">
              Talee​m Tech E-Books
            </span>

            <h2>
              Upgrade your computer skills
            </h2>

            <p>
              Learn MS Word, Excel, computer basics and more
              with practical digital guides.
            </p>

            <div className="heroPrice">
              <small>Books starting from</small>
              <strong>₹79</strong>
            </div>

            <Link
              href="/ebooks"
              className="heroCardLink"
            >
              View Collection
              <ArrowRight size={17} />
            </Link>

          </div>

        </div>
      </section>


      {/* BENEFITS */}
      <section className="section benefitsSection">
        <div className="container">

          <div className="sectionHead centered">
            <div>
              <span className="eyebrow">
                WHY TALEEM TECH
              </span>

              <h2>
                Learning made simple
              </h2>

              <p>
                Everything you need to improve your digital skills
                without complicated learning material.
              </p>
            </div>
          </div>

          <div className="benefitGrid">

            <div className="benefitCard">
              <div className="benefitIcon">
                <BookOpen size={23} />
              </div>

              <h3>Practical E-Books</h3>

              <p>
                Learn with simple explanations, examples and
                useful computer exercises.
              </p>
            </div>


            <div className="benefitCard">
              <div className="benefitIcon">
                <Zap size={23} />
              </div>

              <h3>Instant Access</h3>

              <p>
                Purchase your e-book and access your digital
                learning library quickly.
              </p>
            </div>


            <div className="benefitCard">
              <div className="benefitIcon">
                <GraduationCap size={23} />
              </div>

              <h3>Made for Students</h3>

              <p>
                Beginner-friendly material suitable for students
                and computer learners.
              </p>
            </div>


            <div className="benefitCard">
              <div className="benefitIcon">
                <ShieldCheck size={23} />
              </div>

              <h3>Learn with Confidence</h3>

              <p>
                Organised digital resources from Taleem Tech
                Computer Training Centre.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* FEATURED BOOKS */}
      <section className="section featuredSection">
        <div className="container">

          <div className="sectionHead">

            <div>
              <span className="eyebrow">
                OUR COLLECTION
              </span>

              <h2>
                Featured E-Books
              </h2>

              <p>
                Start learning with our most useful digital guides.
              </p>
            </div>

            <Link
              href="/ebooks"
              className="sectionLink"
            >
              View all
              <ArrowRight size={16} />
            </Link>

          </div>


          <div className="grid">

            {(products || []).map((product) => (
              <ProductCard
                key={product.id}
                p={product}
              />
            ))}

          </div>


          {(!products || products.length === 0) && (
            <div className="emptyState">
              <BookOpen size={38} />

              <h3>
                E-books coming soon
              </h3>

              <p>
                We're preparing new digital learning resources.
              </p>
            </div>
          )}

        </div>
      </section>


      {/* STATS / TRUST */}
      <section className="section statsSection">
        <div className="container">

          <div className="statsCard">

            <div className="stat">
              <Users size={25} />
              <strong>Student Focused</strong>
              <span>Created for practical learning</span>
            </div>

            <div className="stat">
              <BookOpen size={25} />
              <strong>Useful Resources</strong>
              <span>Learn important computer skills</span>
            </div>

            <div className="stat">
              <Download size={25} />
              <strong>Digital Access</strong>
              <span>Keep your books in your library</span>
            </div>

            <div className="stat">
              <CheckCircle2 size={25} />
              <strong>Learn at Your Pace</strong>
              <span>Study whenever you want</span>
            </div>

          </div>

        </div>
      </section>


      {/* FINAL CTA */}
      <section className="section ctaSection">
        <div className="container">

          <div className="ctaCard">

            <div>
              <span className="eyebrow">
                START LEARNING TODAY
              </span>

              <h2>
                Ready to improve your computer skills?
              </h2>

              <p>
                Explore our digital learning collection and
                choose the e-books that match your goals.
              </p>
            </div>

            <div className="ctaActions">

              <Link
                href="/ebooks"
                className="btn primary"
              >
                Browse E-Books
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/about"
                className="btn ghost"
              >
                Learn About Us
              </Link>

            </div>

          </div>

        </div>
      </section>

    </main>
  )
}


function ProductCard({ p }) {
  return (
    <Link
      className="card"
      href={`/products/${p.slug}`}
    >

      <div className="cover">

        {p.cover_url ? (
          <img
            src={p.cover_url}
            alt={p.title}
          />
        ) : (
          <BookOpen size={42} />
        )}

        <span>
          {p.pages || 'PDF'} pages
        </span>

      </div>


      <div className="cardBody">

        <small>
          {p.categories?.name || 'Computer Skills'}
        </small>

        <h3>
          {p.title}
        </h3>

        <p>
          {p.description ||
            'Practical, easy-to-follow digital learning guide.'}
        </p>


        <div className="price">

          <b>
            {money(p.price)}
          </b>

          {p.compare_at_price && (
            <del>
              {money(p.compare_at_price)}
            </del>
          )}

        </div>

        <div className="cardAction">
          View E-Book
          <ArrowRight size={16} />
        </div>

      </div>

    </Link>
  )
}