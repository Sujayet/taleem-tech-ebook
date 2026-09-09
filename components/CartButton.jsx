'use client'
import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
export default function CartButton({product}){const [added,setAdded]=useState(false);function add(){const cart=JSON.parse(localStorage.getItem('tt_cart')||'[]');const i=cart.findIndex(x=>x.id===product.id);if(i>=0)cart[i].quantity++;else cart.push({id:product.id,title:product.title,price:product.price,cover_url:product.cover_url,quantity:1});localStorage.setItem('tt_cart',JSON.stringify(cart));setAdded(true);window.dispatchEvent(new Event('storage'));setTimeout(()=>setAdded(false),1300)}return <button className="btn primary" onClick={add}>{added?<><Check size={18}/> Added</>:<><ShoppingCart size={18}/> Add to Cart</>}</button>}
