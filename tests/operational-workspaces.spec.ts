import { createHash } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { mockAccount } from './fixtures/account'

function environmentFixture(entityCount = 19911) {
  return {
    checkedAt: '2026-10-18T09:00:00Z',
    bankApi: { available: true, activeConnections: 0, banks: [], mode: 'review-only', basePath: '/api/bank/v1' },
    identity: { provider: 'persona', configured: false },
    globalSanctions: { provider: 'complyadvantage', configured: false },
    ofac: { ready: true, checkedAt: '2026-10-18T09:00:00Z', reason: null, entityCount, nameCount: 41205 },
  }
}

async function mockOwner(page: Page) {
  const requests: string[] = []
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    requests.push(`${route.request().method()} ${path}`)
    const responses: Record<string, unknown> = {
      '/api/admin/auth/me': {
        admin: { id: 'owner', name: 'Owner', email: 'owner@example.invalid', role: 'owner' },
      },
      '/api/admin/overview': {
        customers: { total: 12, active: 10, verified: 8 },
        staff: { total: 3, active: 2 },
        awaitingReview: 1,
        byStatus: [],
        volume: [],
      },
      '/api/admin/ledger/trial-balance': { balanced: true, imbalances: [], accounts: [] },
      '/api/admin/transfers': {
        transfers: [
          {
            id: 'transfer-fixture',
            reference: 'XPT-REVIEW',
            status: 'compliance_hold',
            first_name: 'Sender',
            last_name: 'Fixture',
            recipient_name: 'Recipient Fixture',
            recipient_country: 'KE',
            send_amount_minor: 10000,
            send_currency: 'USD',
            receive_amount_minor: 1300000,
            receive_currency: 'KES',
            fee_minor: 99,
          },
        ],
      },
      '/api/admin/transfers/transfer-fixture/screenings': {
        screenings: [],
        screening_ready: true,
        review_required: false,
        current_screening_ids: [],
      },
      '/api/admin/staff': { staff: [] },
      '/api/admin/compliance/overview': {
        testMode: true,
        providers: { identity: false, sanctions: false },
        batches: [],
        keys: [],
        screenings: [],
        identity: [],
      },
      '/api/admin/compliance/eligible': { transfers: [] },
      '/api/admin/compliance/readiness': {
        checkedAt: '2026-10-15T09:00:00Z',
        bankApi: {
          available: true,
          activeConnections: 0,
          banks: [],
          mode: 'review-only',
          basePath: '/api/bank/v1',
        },
        identity: { provider: 'persona', configured: false },
        globalSanctions: { provider: 'complyadvantage', configured: false },
        ofac: {
          ready: true,
          checkedAt: '2026-10-15T09:00:00Z',
          reason: null,
          entityCount: 19911,
          nameCount: 41205,
        },
      },
    }
    return route.fulfill({ json: responses[path] ?? {} })
  })
  return requests
}

test('workflow actions open the next real record, readiness and invitation form without submitting funds', async ({
  page,
}) => {
  const requests = await mockOwner(page)
  await page.goto('/#/admin')
  await page.getByRole('button', { name: /Transfer queue/ }).click()
  await expect(page.getByRole('region', { name: 'Sanctions review' })).toContainText('XPT-REVIEW')
  expect(requests).toContain('GET /api/admin/transfers/transfer-fixture/screenings')
  await page.getByRole('button', { name: /Financial controls/ }).click()
  await expect(page.getByRole('heading', { name: 'Identity & liveness', exact: true })).toBeVisible()
  await expect(page.getByText('OFAC live · 19,911 entities')).toBeVisible()
  await page.getByRole('button', { name: 'Manage bank connections' }).click()
  await expect(page.getByRole('heading', { name: 'Bank API contract' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Open operational bank review portal/ })).toHaveAttribute(
    'href',
    '#/bank-review',
  )
  await page.getByRole('button', { name: /Access governance/ }).click()
  await expect(page.getByPlaceholder('name@xpresstend.com')).toBeVisible()
  expect(requests.filter((request) => request.startsWith('POST'))).toEqual([])
})

test('public navigation is compact and the demo works as a full-screen mobile app without API writes', async ({
  page,
}) => {
  const writes: string[] = []
  await page.route('**/api/**', (route) => {
    if (route.request().method() !== 'GET') writes.push(route.request().url())
    return route.fulfill({ status: 401, json: { error: 'unauthorized' } })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('header').getByRole('link', { name: 'Get started', exact: true })).toHaveCount(0)
  await expect(page.locator('footer a[href="#/login"]')).toHaveCount(0)
  await expect(
    page.locator('.corporate-hero-actions').getByRole('link', { name: 'Get started', exact: true }),
  ).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  expect(
    await page.locator('.brand-header-inner').evaluate((el) => el.getBoundingClientRect().height),
  ).toBeLessThanOrEqual(76)
  await page.getByLabel('Menu', { exact: true }).click()
  await expect(
    page.locator('.brand-mobile-menu').getByRole('link', { name: 'Company', exact: true }),
  ).toBeVisible()
  await page.getByLabel('Menu', { exact: true }).click()
  await page.locator('.corporate-hero-actions').getByRole('link', { name: 'Explore app demo' }).click()
  await expect(page).toHaveURL(/#\/demo$/)
  await page.getByRole('button', { name: /Send money Explore a sample transfer/ }).click()
  await page.getByLabel('Sample amount (USD)').fill('125.50')
  await page.getByRole('button', { name: 'Review demo transfer' }).click()
  await expect(page.locator('.demo-summary')).toContainText('$126.49')
  await page.getByRole('button', { name: 'Complete demo', exact: true }).click()
  await page.getByRole('button', { name: 'View demo activity' }).click()
  await expect(page.locator('.demo-content')).toContainText('No money sent')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(844)
  expect(writes).toEqual([])
  await page.screenshot({ path: 'test-results/interactive-demo-mobile.png', fullPage: true })
})

// Deliberately synthetic, unprivileged test credential used only against intercepted routes.
const bankKey = `xpt_bank_${'a'.repeat(64)}`
async function mockBank(page: Page, corrupt = false, paged = false) {
  const manifest = {
    version: 1,
    batchId: 'wire-fixture',
    bankId: 'fixture-bank',
    currency: 'USD',
    totalMinor: 10000,
    createdAt: '2026-10-15T09:00:00Z',
    items: [
      {
        id: 'item-fixture',
        reference: 'XPT-FIXTURE',
        first_name: 'Sender',
        last_name: 'Fixture',
        recipient_name: 'Recipient Fixture',
        send_amount_minor: 10000,
        send_currency: 'USD',
        fee_minor: 99,
      },
    ],
  }
  const canonical = JSON.stringify(manifest)
  const batch = {
    id: manifest.batchId,
    bank_id: manifest.bankId,
    currency: 'USD',
    total_minor: 10000,
    item_count: 1,
    status: 'submitted',
    manifest_hash: createHash('sha256').update(canonical).digest('hex'),
  }
  const decisions: unknown[] = []
  let listRequests = 0
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/bank/v1/')) return route.fulfill({ status: 401, json: {} })
    if (route.request().headers().authorization !== `Bearer ${bankKey}`)
      return route.fulfill({ status: 401, json: {} })
    if (path.endsWith('/decision')) {
      decisions.push(route.request().postDataJSON())
      return route.fulfill({ json: { ok: true, expiresAt: '2026-10-15T09:05:00Z' } })
    }
    if (path.endsWith('/batches')) {
      const after = new URL(route.request().url()).searchParams.get('after')
      if (after)
        return route.fulfill({ json: { batches: [{ ...batch, id: 'wire-later' }], nextCursor: null } })
      listRequests++
      return route.fulfill({
        json: {
          batches: [{ ...batch, status: listRequests > 1 ? 'approved' : 'submitted' }],
          nextCursor: paged ? 'page-2' : null,
        },
      })
    }
    return route.fulfill({
      json: {
        batch,
        manifest,
        manifestCanonical: corrupt ? canonical + ' ' : canonical,
        ledger: [],
        screenings: [],
        testMode: true,
      },
    })
  })
  await page.goto('/#/bank-review')
  await page.getByLabel('Bank API key', { exact: true }).fill(bankKey)
  await page.getByRole('button', { name: 'Connect to review API' }).click()
  await page.getByRole('button', { name: /wire-fixture/ }).click()
  return decisions
}

test('bank portal verifies the canonical manifest and records the bank-scoped decision', async ({ page }) => {
  const decisions = await mockBank(page)
  await expect(page.getByText('Hash & totals verified')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Record bank approval', exact: true })).toBeDisabled()
  await page.getByLabel('Bank review reference').fill('FIXTURE-REVIEW-1')
  await page
    .getByLabel('Review reason')
    .fill('Fixture bank reviewed all sample contributions and recorded its decision.')
  await page.getByRole('button', { name: 'Record bank approval', exact: true }).click()
  await expect(page.locator('.bank-notice[role="status"]')).toContainText('Bank approval recorded')
  expect(decisions).toHaveLength(1)
  expect(decisions[0]).toMatchObject({ decision: 'approved', reference: 'FIXTURE-REVIEW-1' })
  expect(
    await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } })),
  ).not.toContain(bankKey)
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click()
  await expect(page.getByLabel('Bank API key', { exact: true })).toHaveValue('')
})

test('bank portal blocks decisions for an altered canonical manifest', async ({ page }) => {
  const decisions = await mockBank(page, true)
  await expect(page.getByRole('alert')).toContainText('Manifest verification failed')
  await expect(page.getByRole('button', { name: 'Record bank approval', exact: true })).toHaveCount(0)
  expect(decisions).toEqual([])
})

test('an empty held queue clears the previously opened sanctions review', async ({ page }) => {
  await mockOwner(page)
  await page.goto('/#/admin')
  await page.getByRole('button', { name: /Transfer queue/ }).click()
  await expect(page.getByRole('region', { name: 'Sanctions review' })).toBeVisible()
  await page.route('**/api/admin/transfers?**', (route) => route.fulfill({ json: { transfers: [] } }))
  await page.getByRole('button', { name: /Transfer queue/ }).click()
  await expect(page.getByRole('alert')).toContainText('No transfers are awaiting review')
  await expect(page.getByRole('region', { name: 'Sanctions review' })).toHaveCount(0)
})

test('the demo stays outside live account providers for an authenticated customer', async ({ page }) => {
  const requests = await mockAccount(page)
  await page.goto('/#/demo')
  await expect(page.getByRole('region', { name: 'Interactive app demo' })).toBeVisible()
  await page.getByRole('button', { name: /Send money/ }).click()
  await page.getByRole('button', { name: 'Review demo transfer' }).click()
  await expect(page.locator('.demo-summary')).toBeVisible()
  expect(requests).toEqual([])
})

test('bank polling preserves loaded later batches and the pagination cursor', async ({ page }) => {
  await page.clock.install()
  await mockBank(page, false, true)
  await page.getByRole('button', { name: 'Load more batches' }).click()
  await expect(page.getByRole('button', { name: /wire-later/ })).toBeVisible()
  await page.clock.fastForward(31_000)
  await expect(page.getByRole('button', { name: /wire-fixture/ })).toContainText('approved')
  await expect(page.getByRole('button', { name: /wire-later/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Load more batches' })).toHaveCount(0)
})

test('a stale bank decision failure cannot invalidate a reconnected review', async ({ page }) => {
  await mockBank(page)
  let release: (() => Promise<void>) | undefined
  await page.route(
    '**/api/bank/v1/batches/*/decision',
    (route) =>
      new Promise<void>((resolve) => {
        release = async () => {
          await route.fulfill({ status: 503, json: { error: 'old_connection_failed' } })
          resolve()
        }
      }),
  )
  await page.getByLabel('Bank review reference').fill('FIRST-CONNECTION')
  await page.getByLabel('Review reason').fill('First fixture bank review is still waiting for a response.')
  await page.getByRole('button', { name: 'Record bank approval', exact: true }).click()
  await expect.poll(() => !!release).toBe(true)
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click()
  await page.getByLabel('Bank API key', { exact: true }).fill(bankKey)
  await page.getByRole('button', { name: 'Connect to review API' }).click()
  await page.getByRole('button', { name: /wire-fixture/ }).click()
  await expect(page.getByText('Hash & totals verified')).toBeVisible()
  const finished = page.waitForResponse(
    (response) => response.url().endsWith('/decision') && response.status() === 503,
  )
  await release!()
  await finished
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Bank review reference').fill('SECOND-CONNECTION')
  await page
    .getByLabel('Review reason')
    .fill('The replacement fixture connection has completed its own review.')
  await expect(page.getByRole('button', { name: 'Record bank approval', exact: true })).toBeEnabled()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('the shared workstation refresh recovers compliance and refetches the queue and statistics once', async ({ page }) => {
  const requests = await mockOwner(page)
  let calls = 0
  await page.route('**/api/admin/compliance/overview', (route) => {
    calls++
    if (calls === 1) return route.fulfill({ status: 503, json: { error: 'temporarily_unavailable' } })
    return route.fulfill({
      json: {
        testMode: true,
        providers: { identity: false, sanctions: false },
        batches: [],
        keys: [],
        screenings: [],
        identity: [],
      },
    })
  })
  await page.goto('/#/admin')
  await page.getByRole('button', { name: /Financial controls/ }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Refresh environment', exact: true })).toHaveCount(0)
  const previous = [...requests]
  const refresh = page.getByRole('button', { name: 'Refresh workstation', exact: true })
  await refresh.click()
  await expect(refresh).toBeEnabled()
  await expect(page.locator('.operations-toolbar [role="status"]')).toContainText('Updated')
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(calls).toBe(2)
  for (const path of ['/api/admin/transfers', '/api/admin/ledger/trial-balance', '/api/admin/overview', '/api/admin/compliance/eligible', '/api/admin/compliance/readiness']) {
    expect(requests.filter(request => request === `GET ${path}`).length - previous.filter(request => request === `GET ${path}`).length).toBe(1)
  }
  expect(requests.filter(request => !request.startsWith('GET '))).toEqual([])
})

test('shared refresh awaits the environment, preserves connection drafts and works outside Financial controls', async ({ page }) => {
  const requests = await mockOwner(page)
  await page.goto('/#/admin')
  const refresh = page.getByRole('button', { name: 'Refresh workstation', exact: true })
  await expect(refresh).toBeEnabled()
  await page.getByRole('button', { name: /Financial controls/ }).click()
  await page.getByRole('button', { name: 'Connections & API', exact: true }).click()
  await page.getByLabel('Bank identifier', { exact: true }).fill('draft-bank')
  const draft = page.getByLabel('Connection label', { exact: true })
  await draft.fill('Unsubmitted connection draft')
  let release: (() => Promise<void>) | undefined
  let readinessCalls = 0
  await page.route('**/api/admin/compliance/readiness', route => {
    readinessCalls++
    if (readinessCalls === 1) return new Promise<void>(resolve => {
      release = async () => {
        await route.fulfill({ json: environmentFixture(29911) })
        resolve()
      }
    })
    return route.fulfill({ json: environmentFixture(30111) })
  })
  const overviewBefore = requests.filter(request => request === 'GET /api/admin/overview').length
  await refresh.click()
  await expect.poll(() => readinessCalls).toBe(1)
  await expect.poll(() => requests.filter(request => request === 'GET /api/admin/overview').length).toBe(overviewBefore + 1)
  await expect(refresh).toBeDisabled()
  await expect(page.locator('.operations-toolbar [role="status"]')).toHaveText('Refreshing workstation…')
  await page.getByRole('button', { name: 'Staff', exact: true }).click()
  await expect(draft).toBeHidden()
  await expect(page.getByRole('button', { name: 'Create scoped key', exact: true })).toBeHidden()
  await page.getByRole('button', { name: 'Compliance & banks', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Connections & API', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(draft).toHaveValue('Unsubmitted connection draft')
  await release!()
  await expect(refresh).toBeEnabled()
  await expect(page.getByLabel('Bank identifier', { exact: true })).toHaveValue('draft-bank')
  await expect(draft).toHaveValue('Unsubmitted connection draft')
  await page.getByRole('button', { name: 'Transfers', exact: true }).click()
  await expect(draft).toBeHidden()
  await refresh.click()
  await expect(refresh).toBeEnabled()
  expect(readinessCalls).toBe(2)
  await page.getByRole('button', { name: 'Compliance & banks', exact: true }).click()
  await expect(draft).toHaveValue('Unsubmitted connection draft')
  await page.getByRole('button', { name: 'Verification', exact: true }).click()
  await expect(page.getByText('OFAC live · 30,111 entities', { exact: true })).toBeVisible()
  expect(requests.filter(request => !request.startsWith('GET '))).toEqual([])
})

for (const area of ['environment', 'queue'] as const) test(`a superseding ${area} poll remains part of the shared refresh outcome and can recover`, async ({ page }) => {
  await page.clock.install()
  const requests = await mockOwner(page)
  const releases: Record<number, () => Promise<void>> = {}
  let calls = 0
  const payload = (stage: 'initial' | 'stale' | 'recovered') => area === 'environment'
    ? environmentFixture(stage === 'initial' ? 19911 : stage === 'stale' ? 11111 : 39911)
    : {
        customers: { total: stage === 'initial' ? 12 : stage === 'stale' ? 99 : 15, active: 10, verified: 8 },
        staff: { total: 3, active: 2 },
        awaitingReview: 1,
        byStatus: [], volume: [],
      }
  await page.route(area === 'environment' ? '**/api/admin/compliance/readiness' : '**/api/admin/overview', route => {
    const call = ++calls
    if (call === 2 || call === 3) return new Promise<void>(resolve => {
      releases[call] = async () => {
        await route.fulfill(call === 2
          ? { json: payload('stale') }
          : { status: 503, json: { error: 'readiness_unavailable' } })
        resolve()
      }
    })
    return route.fulfill({ json: payload(call === 1 ? 'initial' : 'recovered') })
  })
  await page.goto('/#/admin')
  const refresh = page.getByRole('button', { name: 'Refresh workstation', exact: true })
  await expect(refresh).toBeEnabled()
  await refresh.click()
  await expect.poll(() => calls).toBe(2)
  await page.clock.fastForward(30001)
  await expect.poll(() => calls).toBe(3)
  await releases[2]()
  await expect(refresh).toBeDisabled()
  await expect(page.locator('.operations-toolbar [role="status"]')).toHaveText('Refreshing workstation…')
  await releases[3]()
  await expect(refresh).toBeEnabled()
  await expect(page.locator('.operations-toolbar [role="status"]')).toHaveText('Refresh incomplete. Please retry.')
  await expect(page.getByText(`Could not refresh ${area === 'environment' ? 'the financial controls environment' : 'the queue and statistics'}. Please retry.`, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Compliance & banks', exact: true }).click()
  if (area === 'environment') {
    await expect(page.getByText('OFAC live · 19,911 entities', { exact: true })).toHaveCount(0)
    await expect(page.getByText('OFAC live · 11,111 entities', { exact: true })).toHaveCount(0)
  } else {
    await expect(page.locator('[data-operations-metric="customers"] p').nth(1)).toHaveText('12')
  }
  await refresh.click()
  await expect(refresh).toBeEnabled()
  await expect(page.locator('.operations-toolbar [role="status"]')).toContainText('Updated')
  await expect(page.getByRole('alert')).toHaveCount(0)
  if (area === 'environment')
    await expect(page.getByText('OFAC live · 39,911 entities', { exact: true })).toBeVisible()
  else
    await expect(page.locator('[data-operations-metric="customers"] p').nth(1)).toHaveText('15')
  expect(requests.filter(request => !request.startsWith('GET '))).toEqual([])
})

test('workstation refresh preserves viewer and agent permissions without compliance requests', async ({ page }) => {
  for (const role of ['viewer', 'agent']) {
    const requests = await mockOwner(page)
    await page.route('**/api/admin/auth/me', route => route.fulfill({
      json: { admin: { id: role, name: role, email: `${role}@example.invalid`, role } },
    }))
    await page.goto('/#/admin')
    const refresh = page.getByRole('button', { name: 'Refresh workstation', exact: true })
    await expect(refresh).toBeEnabled()
    const overviewBefore = requests.filter(request => request === 'GET /api/admin/overview').length
    await refresh.click()
    await expect(refresh).toBeEnabled()
    expect(requests.filter(request => request === 'GET /api/admin/overview').length).toBe(overviewBefore + 1)
    await page.getByRole('button', { name: 'Compliance & banks', exact: true }).click()
    await expect(page.getByText('Compliance or owner access is required.', { exact: true })).toBeVisible()
    expect(requests.filter(request => request.includes('/api/admin/compliance/'))).toEqual([])
    expect(requests.filter(request => !request.startsWith('GET '))).toEqual([])
  }
})

test('bank selection uses complete active connections rather than credential history', async ({ page }) => {
  await mockOwner(page)
  await page.route('**/api/admin/compliance/readiness', (route) =>
    route.fulfill({
      json: {
        checkedAt: '2026-10-15T09:00:00Z',
        bankApi: {
          available: true,
          activeConnections: 1,
          banks: ['older-active-bank'],
          mode: 'review-only',
          basePath: '/api/bank/v1',
        },
        identity: { provider: 'persona', configured: false },
        globalSanctions: { provider: 'complyadvantage', configured: false },
        ofac: {
          ready: true,
          checkedAt: '2026-10-15T09:00:00Z',
          reason: null,
          entityCount: 19911,
          nameCount: 41205,
        },
      },
    }),
  )
  await page.goto('/#/admin')
  await page.getByRole('button', { name: /Financial controls/ }).click()
  await expect(page.getByText('1 active scoped connection.')).toBeVisible()
  await page.getByRole('button', { name: 'Bank review', exact: true }).click()
  await page.getByLabel('Review bank identifier', { exact: true }).selectOption('older-active-bank')
  await expect(page.getByLabel('Review bank identifier', { exact: true })).toHaveValue('older-active-bank')
})
