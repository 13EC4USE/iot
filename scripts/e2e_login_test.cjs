;(async () => {
  try {
    const dotenv = await import('dotenv')
    if (dotenv && typeof dotenv.config === 'function') dotenv.config({ path: '.env.local' })

    const fetch = (await import('node-fetch')).default

    const base = process.env.E2E_BASE_URL || 'http://localhost:3000'
    const loginUrl = `${base}/api/auth/login`
    const dashboardUrl = `${base}/admin/dashboard`

    console.log('[e2e] Posting to', loginUrl)
    const res = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@iot.com', password: 'password123' }),
    })

    const text = await res.text()
    console.log('[e2e] login status', res.status)
    console.log('[e2e] login body', text)

    // Try to GET the admin dashboard (no cookies)
    console.log('[e2e] GET', dashboardUrl)
    const dash = await fetch(dashboardUrl, { method: 'GET', redirect: 'manual' })
    console.log('[e2e] dashboard status', dash.status)
    console.log('[e2e] dashboard headers:', Object.fromEntries(dash.headers.entries()))
    const dashBody = await dash.text()
    console.log('[e2e] dashboard body preview:', dashBody.slice(0, 300))

    process.exit(0)
  } catch (err) {
    console.error('e2e test error:', err)
    process.exit(1)
  }
})()
