const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const checkoutService = {
  async createCheckout(priceId: string, userId?: string) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ priceId, userId }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Checkout failed')
    }

    const { url } = await res.json()
    if (url) {
      window.location.href = url
    }
  },
}
