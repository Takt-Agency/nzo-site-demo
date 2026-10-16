import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'nzo-cart'

const CartContext = createContext(null)

function loadInitial() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitial)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  const addItem = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === product.id)
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p,
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          nameKey: product.nameKey,
          shortKey: product.shortKey,
          price: product.price,
          sku: product.sku,
          category: product.category,
          quantity,
        },
      ]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((p) => p.id !== id)
      return prev.map((p) => (p.id === id ? { ...p, quantity } : p))
    })
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const subtotal = useMemo(
    () => items.reduce((sum, p) => sum + p.price * p.quantity, 0),
    [items],
  )

  const count = useMemo(
    () => items.reduce((sum, p) => sum + p.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      isOpen,
      open,
      close,
      toggle,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      subtotal,
      count,
    }),
    [items, isOpen, open, close, toggle, addItem, removeItem, updateQuantity, clear, subtotal, count],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function formatPrice(amount, currency = 'CHF') {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function buildWhatsAppMessage(items, subtotal, t) {
  const lines = [t('shop.cart.waIntro')]
  items.forEach((item) => {
    lines.push(
      `• ${t(item.nameKey)} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`,
    )
  })
  lines.push('')
  lines.push(`${t('shop.cart.total')}: ${formatPrice(subtotal)}`)
  return lines.join('\n')
}

export function buildEmailBody(items, subtotal, t) {
  return buildWhatsAppMessage(items, subtotal, t)
}
