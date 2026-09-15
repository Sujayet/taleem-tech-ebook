import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata={
  title:'Taleem Tech | Digital Products & Instant Access',
  description:'Taleem Tech is a modern digital store for e-books, learning resources, templates and useful digital products with instant access after purchase.',
}

export default function RootLayout({children}){
  return <html lang="en"><body><Header/><main>{children}</main><Footer/></body></html>
}
