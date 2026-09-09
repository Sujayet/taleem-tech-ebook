'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, ShoppingCart, User, LogOut, Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
export default function Header(){
 const [user,setUser]=useState(null),[open,setOpen]=useState(false),[count,setCount]=useState(0)
 useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user||null)); const {data}=supabase.auth.onAuthStateChange((_,s)=>setUser(s?.user||null)); const sync=()=>setCount(JSON.parse(localStorage.getItem('tt_cart')||'[]').reduce((a,x)=>a+x.quantity,0)); sync(); window.addEventListener('storage',sync); return()=>{data.subscription.unsubscribe();window.removeEventListener('storage',sync)}} ,[])
 const logout=async()=>{await supabase.auth.signOut();location.href='/'}
 return <header className="header"><div className="container nav"><Link className="brand" href="/"><span className="logo">TT</span><span><b>Taleem Tech</b><small>Computer Training Centre</small></span></Link><button className="menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><nav className={open?'show':''}><Link href="/">Home</Link><Link href="/ebooks">E-Books</Link><Link href="/library">My Library</Link><Link href="/orders">Orders</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link className="cart" href="/cart"><ShoppingCart size={18}/>{count>0&&<i>{count}</i>}</Link>{user?<button className="logout" onClick={logout}><LogOut size={16}/> Logout</button>:<Link className="login" href="/login"><User size={16}/> Login</Link>}</nav></div></header>
}
