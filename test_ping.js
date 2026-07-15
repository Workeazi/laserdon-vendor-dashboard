async function ping() {
  console.log('Fetching Supabase status...')
  try {
    const res = await fetch('https://iuhmswsjzqrxpvgravfi.supabase.co', { method: 'GET' })
    console.log('Status code:', res.status)
  } catch (err) {
    console.error('Fetch failed:', err)
  }
}
ping()
