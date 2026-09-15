import Link from 'next/link'
import { ArrowUpRight, BookOpen, CheckCircle2, Mail, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.topGlow} aria-hidden="true" />
      <div className="container">
        <div className={styles.main}>
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.brand}>
              <span className={styles.logo}><BookOpen size={20} /></span>
              <span><b>Taleem Tech</b><small>Digital Store</small></span>
            </Link>
            <p className={styles.intro}>A modern digital marketplace for e-books, learning resources, templates and other useful digital products — delivered instantly after purchase.</p>
            <div className={styles.badges}>
              <span><CheckCircle2 size={14} /> Instant access</span>
              <span><ShieldCheck size={14} /> Secure checkout</span>
              <span><Sparkles size={14} /> Digital delivery</span>
            </div>
          </div>

          <div className={styles.linksColumn}>
            <h3>Store</h3>
            <Link href="/ebooks">Digital Products <ArrowUpRight size={13} /></Link>
            <Link href="/discover">Discover <ArrowUpRight size={13} /></Link>
            <Link href="/cart">Shopping Cart <ArrowUpRight size={13} /></Link>
          </div>

          <div className={styles.linksColumn}>
            <h3>Your Account</h3>
            <Link href="/library">My Library <ArrowUpRight size={13} /></Link>
            <Link href="/orders">Orders <ArrowUpRight size={13} /></Link>
            <Link href="/profile">Profile <ArrowUpRight size={13} /></Link>
            <Link href="/login">Login <ArrowUpRight size={13} /></Link>
          </div>

          <div className={styles.linksColumn}>
            <h3>Company</h3>
            <Link href="/about">About Taleem Tech <ArrowUpRight size={13} /></Link>
            <Link href="/contact">Contact & Support <ArrowUpRight size={13} /></Link>
            <a href="mailto:taleemtechinfo@gmail.com"><Mail size={14} /> Email us</a>
            <a href="tel:+918910499357"><Phone size={14} /> Call us</a>
          </div>
        </div>

        <div className={styles.contactBar}>
          <div><MapPin size={16} /><span>17/11 Topsia Road, Kolkata, West Bengal 700039</span></div>
          <div className={styles.contactRight}><span>ISO 9001:2015 Certified</span><span>•</span><span>Built for instant digital access</span></div>
        </div>

        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} Taleem Tech Computer Training Centre. All rights reserved.</span>
          <span>Digital products. Instant access. Keep learning.</span>
        </div>
      </div>
    </footer>
  )
}
