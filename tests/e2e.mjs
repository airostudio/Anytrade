#!/usr/bin/env node
/**
 * End-to-end smoke tests for AnyTrade, driven through a real browser.
 *
 *   1. npm run db:reset          (fresh schema + seed — the suite mutates data)
 *   2. npm run build && npm start
 *   3. npm run test:e2e
 *
 * Set BASE_URL if the app is not on http://localhost:3000.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const TRADIE = { email: 'bruce.kowalski@kowalski-home-handyman.com.au', password: 'Password!123' }
const CLIENT = { email: 'margaret.doyle@example.com', password: 'Password!123' }
const ADMIN = { email: 'admin@anytrade.com.au', password: 'Admin!2345' }
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE ?? 'toolbox-1972'
const HOMEGIRLS_PASSCODE = process.env.HOMEGIRLS_PASSCODE ?? 'homegirls-2024'

const passed = []
const failed = []
const check = (name, ok, detail = '') => {
  ;(ok ? passed : failed).push(name)
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const launchOptions = { headless: true, args: ['--no-sandbox'] }
// Some sandboxes proxy all egress, which breaks page fetch() to localhost and
// with it every server action. Bypass the proxy for loopback when one is set.
if (process.env.HTTPS_PROXY) {
  launchOptions.proxy = { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }
}
if (process.env.CHROME_PATH) launchOptions.executablePath = process.env.CHROME_PATH

async function signIn(page, { email, password }) {
  await page.goto(`${BASE}/signin`, { waitUntil: 'domcontentloaded' })
  await page.fill('#email', email)
  await page.fill('#password', password)
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes('/signin'), { timeout: 30000 }),
    page.locator('button:has-text("Sign in")').last().click(),
  ])
}

/** Reads a dashboard stat tile by its label. */
async function statValue(page, label) {
  const tile = page.locator(`p:text-is("${label}")`).first()
  if (!(await tile.count())) return null
  return (await tile.locator('xpath=following-sibling::p[1]').first().textContent())?.trim() ?? null
}

const browser = await chromium.launch(launchOptions)

try {
  // ── Public pages render ──────────────────────────────────────────────────
  {
    const page = await (await browser.newContext()).newPage()
    for (const path of ['/', '/handyman', '/find-a-tradie', '/trades', '/trades/handyman', '/pricing', '/how-it-works', '/contact']) {
      const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
      check(`public page ${path}`, res?.status() === 200, String(res?.status()))
    }
    await page.goto(`${BASE}/find-a-tradie`, { waitUntil: 'domcontentloaded' })
    check('directory lists tradies', (await page.locator('a[href^="/find-a-tradie/"]').count()) > 0)

    const profile = await page.getAttribute('a[href^="/find-a-tradie/"]', 'href')
    await page.goto(BASE + profile, { waitUntil: 'domcontentloaded' })
    const body = await page.textContent('body')
    check('profile shows ratings and sub-scores', /Ratings & reviews/.test(body) && /Quality of work/.test(body))

    await page.goto(`${BASE}/post-a-job`, { waitUntil: 'domcontentloaded' })
    check('posting a job requires sign-in', page.url().includes('/signin'))
  }

  // ── Bidding: tradie quotes on a lead ─────────────────────────────────────
  let quotedJobUrl = null
  {
    const page = await (await browser.newContext()).newPage()
    await signIn(page, TRADIE)
    check('tradie signs in to their own dashboard', page.url().includes('/tradie'), page.url())

    await page.goto(`${BASE}/tradie/leads`, { waitUntil: 'domcontentloaded' })
    const lead = await page.getAttribute('a[href^="/tradie/leads/"]', 'href').catch(() => null)
    check('lead feed has matching jobs', Boolean(lead), lead ?? 'none')

    if (lead) {
      quotedJobUrl = lead.replace('/tradie/leads/', '')
      await page.goto(BASE + lead, { waitUntil: 'domcontentloaded' })
      await page.fill('#amount', '480')
      await page.fill(
        '#message',
        'Happy to take this one on. I can bring the timber and brackets with me and have it done in an afternoon. Price includes materials and GST.'
      )
      await page.check('#includesMaterials')
      await Promise.all([
        page.waitForURL(/\/tradie\/bids/, { timeout: 30000 }),
        page.locator('button:has-text("Submit my quote")').click(),
      ])
      check('quote submits', page.url().includes('/tradie/bids'))
      check('quote appears in My quotes', (await page.textContent('body')).includes('$480'))

      await page.goto(BASE + lead, { waitUntil: 'domcontentloaded' })
      check('cannot quote the same job twice', (await page.textContent('body')).includes('Quote submitted'))

      await page.goto(`${BASE}/tradie/billing`, { waitUntil: 'domcontentloaded' })
      check('credit spend recorded in the ledger', (await page.textContent('body')).includes('Quote submitted'))
    }
  }

  // ── Billing: demo-mode purchase ──────────────────────────────────────────
  {
    const page = await (await browser.newContext()).newPage()
    await signIn(page, TRADIE)
    await page.goto(`${BASE}/tradie/billing`, { waitUntil: 'domcontentloaded' })

    const before = Number(await statValue(page, 'Lead credits'))
    await page.locator('button:has-text("Buy 30 credits")').click()
    await page.waitForLoadState('networkidle')
    // The action redirects back here; re-navigate so the assertions read the
    // settled page rather than the pre-redirect document.
    await page.waitForTimeout(1500)
    await page.goto(`${BASE}/tradie/billing`, { waitUntil: 'domcontentloaded' })

    const body = await page.textContent('body')
    check('credit pack recorded as an invoice', body.includes('Toolbox Pack'))

    const after = Number(await statValue(page, 'Lead credits'))
    check('credit balance increased by 30', after === before + 30, `${before} -> ${after}`)
  }

  // ── Hiring and two-way ratings ───────────────────────────────────────────
  {
    const page = await (await browser.newContext()).newPage()
    await signIn(page, CLIENT)
    check('client signs in to their own dashboard', page.url().includes('/dashboard'), page.url())

    const jobUrl = quotedJobUrl ? `/dashboard/jobs/${quotedJobUrl}` : null
    if (jobUrl) {
      await page.goto(BASE + jobUrl, { waitUntil: 'domcontentloaded' })
      const body = await page.textContent('body')
      check('bid comparison shows lowest / average / highest', /Lowest/.test(body) && /Average/.test(body) && /Highest/.test(body))

      const shortlist = page.locator('button:has-text("Shortlist")').first()
      if (await shortlist.count()) {
        await shortlist.click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1200)
        check('shortlisting works', (await page.textContent('body')).includes('Remove shortlist'))
      }

      // Accept *our* tradie's quote so the follow-up rating checks line up.
      const ourQuote = page.locator('li').filter({ hasText: '$480' })
      const acceptOurs = ourQuote.locator('button:has-text("Accept quote")')
      const accept = (await acceptOurs.count())
        ? acceptOurs.first()
        : page.locator('button:has-text("Accept quote")').first()
      await accept.click()
      await page.waitForTimeout(300)
      await page.locator('button:has-text("Yes, hire")').first().click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)
      await page.reload({ waitUntil: 'domcontentloaded' })
      check('accepting a quote awards the job', (await page.textContent('body')).includes('Agreed price'))

      await Promise.all([
        page.waitForURL(/\/review/, { timeout: 30000 }),
        page.locator('button:has-text("sign it off")').first().click(),
      ])
      check('sign-off opens the rating form', page.url().includes('/review'))

      const fiveStar = page.locator('button[aria-label="5 stars"]')
      const stars = await fiveStar.count()
      for (let i = 0; i < Math.min(stars, 6); i++) await fiveStar.nth(i).click()
      await page.locator('button:has-text("Turned up on time")').first().click()
      await page.fill(
        '#comment',
        'Turned up exactly when he said he would and got the whole list done in one visit. Tidy, fair price, no surprises on the bill.'
      )
      await Promise.all([
        page.waitForURL((u) => !u.pathname.includes('/review'), { timeout: 30000 }),
        page.locator('button:has-text("Publish my rating")').click(),
      ])
      check('rating publishes', page.url().includes('/dashboard'))
    }
  }

  // ── Tradie rates the customer back ───────────────────────────────────────
  {
    const page = await (await browser.newContext()).newPage()
    await signIn(page, TRADIE)
    await page.goto(`${BASE}/tradie`, { waitUntil: 'domcontentloaded' })
    const rateLink = await page.getAttribute('a[href$="/review"]', 'href').catch(() => null)
    check('tradie is prompted to rate the customer', Boolean(rateLink), rateLink ?? 'none')

    if (rateLink) {
      await page.goto(BASE + rateLink, { waitUntil: 'domcontentloaded' })
      await page.locator('button[aria-label="5 stars"]').first().click()
      await page.locator('button:has-text("Paid promptly")').first().click()
      await page.fill('#comment', 'Job was exactly as described, easy access and paid on the day. Would work for again any time.')
      await Promise.all([
        page.waitForURL((u) => !u.pathname.includes('/review'), { timeout: 30000 }),
        page.locator('button:has-text("Publish my rating")').click(),
      ])
      check('customer rating publishes', page.url().includes('/tradie'))
    }
  }

  // ── Admin: role guard + passcode gate ────────────────────────────────────
  {
    const page = await (await browser.newContext()).newPage()
    await signIn(page, ADMIN)
    await page.waitForURL(/\/admin\/unlock/, { timeout: 30000 })
    check('admin is held at the passcode gate', page.url().includes('/admin/unlock'))

    await page.fill('#passcode', 'definitely-not-the-passcode')
    await page.locator('button:has-text("Unlock back office")').click()
    await page.waitForTimeout(1500)
    check('wrong admin passcode is rejected', (await page.textContent('body')).includes('not right'))

    await page.fill('#passcode', ADMIN_PASSCODE)
    await Promise.all([
      page.waitForURL(/\/admin$/, { timeout: 30000 }),
      page.locator('button:has-text("Unlock back office")').click(),
    ])
    check('correct admin passcode unlocks', page.url().endsWith('/admin'))

    for (const path of ['/admin', '/admin/users', '/admin/tradies', '/admin/jobs', '/admin/bids', '/admin/payments', '/admin/reviews', '/admin/homegirls', '/admin/enquiries', '/admin/analytics', '/admin/audit', '/admin/settings']) {
      const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
      check(`admin page ${path}`, res?.status() === 200, String(res?.status()))
    }
  }

  // ── Non-admin cannot reach the back office ───────────────────────────────
  {
    const page = await (await browser.newContext()).newPage()
    await signIn(page, CLIENT)
    await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' })
    check('client is bounced out of /admin', !page.url().includes('/admin'), page.url())
    await page.goto(`${BASE}/tradie`, { waitUntil: 'domcontentloaded' })
    check('client is bounced out of /tradie', page.url().includes('/dashboard'), page.url())
  }

  // ── Homegirls passcode gate ──────────────────────────────────────────────
  {
    const page = await (await browser.newContext()).newPage()
    await page.goto(`${BASE}/homegirls`, { waitUntil: 'domcontentloaded' })
    check('homegirls redirects to its gate', page.url().includes('/homegirls/enter'))

    await page.fill('#passcode', 'nope')
    await page.locator('button:has-text("Enter")').first().click()
    await page.waitForTimeout(1500)
    check('wrong homegirls passcode is rejected', (await page.textContent('body')).includes('not right'))

    await page.fill('#passcode', HOMEGIRLS_PASSCODE)
    await Promise.all([
      page.waitForURL(/\/homegirls$/, { timeout: 30000 }),
      page.locator('button:has-text("Enter")').first().click(),
    ])
    check('correct homegirls passcode opens the network', page.url().endsWith('/homegirls'))
    const body = await page.textContent('body')
    check('homegirls content renders', /Members directory/.test(body) && /noticeboard/i.test(body))
  }

  // ── Contact form ─────────────────────────────────────────────────────────
  {
    const page = await (await browser.newContext()).newPage()
    await page.goto(`${BASE}/contact`, { waitUntil: 'domcontentloaded' })
    await page.fill('#name', 'Test Enquirer')
    await page.fill('#email', 'test.enquirer@example.com')
    await page.fill('#message', 'Checking the contact form saves an enquiry for the back office.')
    await page.locator('button:has-text("Send message")').click()
    await page.waitForTimeout(2500)
    check('contact form saves an enquiry', (await page.textContent('body')).includes('Thanks'))
  }
} finally {
  await browser.close()
}

console.log(`\n  ${passed.length} passed, ${failed.length} failed\n`)
if (failed.length) {
  for (const name of failed) console.log(`   FAILED: ${name}`)
  process.exit(1)
}
