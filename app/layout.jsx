import './globals.css'
import Header from '@/components/Header'
export const metadata={title:'Taleem Tech E-Books',description:'Professional digital computer learning e-books from Taleem Tech Computer Training Centre.'}
export default function RootLayout({children}){return <html lang="en"><body><Header/><main>{children}</main><footer><div className="container footer"><div><b>Taleem Tech Computer Training Centre</b><p>ISO Certified 9001:2015</p></div><div><p>17/11 Topsia Road, Kolkata, West Bengal 700039</p><p>8910499357 / 6291311731 · taleemtechinfo@gmail.com</p></div></div><div className="copy">© 2026 Taleem Tech. All rights reserved.</div></footer></body></html>}
