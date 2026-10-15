import { expect, test } from '@playwright/test'
import { dictionaries, interpolate } from '../src/i18n'
import { LANGUAGES, isLang } from '../src/i18n/langs'
import {
  readPassage,
  sitePages,
  privacyPage,
  supportPage,
} from '../src/marketing/siteContent'
import { philanthropyPage } from '../src/marketing/philanthropyCopy'
import { interfaceMessages } from '../src/i18n/interfaceCopy'
import { corridors, getCorridor, corridorName } from '../src/data/product'
import { CORRIDORS } from '../src/marketing/pricing'
import {
  customer,
  corridor,
  savedRecipient,
  mockAccount,
} from './fixtures/account'

test('every offered language has complete core copy and matching substitution variables', () => {
  expect(LANGUAGES.map((l) => l.code).sort()).toEqual([
    'ar',
    'en',
    'es',
    'pt-BR',
  ])
  expect(isLang('so')).toBe(false)
  const archived = getCorridor('SO')
  expect(archived.code).toBe('SO')
  expect(archived.flag).toBe('🌐')
  expect(corridorName(archived, 'en')).toBe('Archived destination')
  expect(corridorName(archived, 'ar')).toBe('وجهة مؤرشفة')
  const vars = (s: string) =>
    [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
  for (const { code } of LANGUAGES) {
    expect(Object.keys(dictionaries[code]).sort()).toEqual(
      Object.keys(dictionaries.en).sort(),
    )
    for (const [key, text] of Object.entries(dictionaries[code])) {
      expect(text.trim(), `${code}:${key}`).not.toBe('')
      expect(vars(text), `${code}:${key}`).toEqual(vars(dictionaries.en[key]))
    }
  }
  for (const [english, translations] of Object.entries(interfaceMessages)) {
    expect(translations).toHaveLength(3)
    for (const text of translations) {
      expect(text.trim()).not.toBe('')
      expect(vars(text)).toEqual(vars(english))
    }
  }
  expect(interpolate('{amount}', { amount: '$125.50' }, true)).toBe(
    '\u2068$125.50\u2069',
  )
  expect(corridors.map((c) => c.code)).toEqual(['KE', 'ET', 'BR', 'MX'])
  expect(CORRIDORS.map((c) => c.receive_country)).toEqual([
    'KE',
    'ET',
    'BR',
    'MX',
  ])
})

for (const lang of ['es', 'pt-BR', 'ar'] as const) {
  for (const [path, copy] of Object.entries({
    ...sitePages,
    privacy: privacyPage,
    support: supportPage,
    philanthropy: philanthropyPage,
  })) {
    test(`${path} retains complete ${lang} copy and navigation at phone width`, async ({
      page,
    }) => {
      await page.addInitScript(
        (lang) => localStorage.setItem('xpresstend.lang', lang),
        lang,
      )
      await page.route('**/api/**', (route) =>
        route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
      )
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`/#/${path}`)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        readPassage(copy.title, lang),
      )
      await expect(page.locator('main')).toHaveCSS(
        'direction',
        lang === 'ar' ? 'rtl' : 'ltr',
      )
      for (const section of copy.sections) {
        await expect(page.locator('main')).toContainText(
          readPassage(section.title, lang),
        )
        for (const paragraph of section.paragraphs)
          await expect(page.locator('main')).toContainText(
            readPassage(paragraph, lang),
          )
      }
      const jump = page.locator('.institutional-contents button').last()
      await jump.click()
      await expect(page.locator(`#${copy.sections.at(-1)!.id}`)).toBeFocused()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(390)
      await expect(page.locator('body')).not.toContainText(
        /Somalia|Somali|Somália|الصومال|Af-Soomaali/i,
      )
    })
  }
  test(`the ${lang} demo completes locally and uses the requested fictional names`, async ({
    page,
  }) => {
    await page.addInitScript(
      (lang) => localStorage.setItem('xpresstend.lang', lang),
      lang,
    )
    const requests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/')) requests.push(request.url())
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/#/demo')
    const index = lang === 'es' ? 0 : lang === 'pt-BR' ? 1 : 2
    const p = (s: string) => interfaceMessages[s][index]
    await page.getByRole('button', { name: p('People'), exact: true }).click()
    await expect(page.locator('.demo-content')).toContainText('Sam Erikson')
    await page.getByRole('button', { name: /Farah Bilingsley/ }).click()
    await page
      .getByLabel(p('Sample amount (USD)'), { exact: true })
      .fill('125.50')
    await page
      .getByRole('button', { name: p('Review demo transfer'), exact: true })
      .click()
    await expect(page.locator('.demo-summary')).toContainText(
      new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: 'USD',
      }).format(126.49),
    )
    await page
      .getByRole('button', { name: p('Complete demo'), exact: true })
      .click()
    await page
      .getByRole('button', { name: p('View demo activity'), exact: true })
      .click()
    await expect(page.locator('.demo-content')).toContainText(
      p('No money sent'),
    )
    await expect(page.locator('.demo-content')).toContainText(
      'Farah Bilingsley',
    )
    expect(requests).toEqual([])
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390)
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual(844)
  })
}

test('a retired saved language falls back to English and is absent from the menu', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('xpresstend.lang', 'so'))
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.locator('header button[aria-haspopup=listbox]').click()
  await expect(page.getByRole('option')).toHaveCount(4)
  await expect(
    page.getByRole('option', { name: /Somali|Af-Soomaali/ }),
  ).toHaveCount(0)
})

test('new recipient destinations omit the retired market even when the API still returns its historical corridor', async ({
  page,
}) => {
  await mockAccount(page, { user: customer })
  await page.route('**/api/corridors', (route) =>
    route.fulfill({
      json: {
        corridors: [
          corridor,
          { ...corridor, id: 'cor_us_so', receive_country: 'SO' },
        ],
      },
    }),
  )
  await page.goto('/#/recipients')
  await page
    .getByRole('button', { name: 'Add new recipient', exact: true })
    .click()
  const select = page.getByLabel('Destination', { exact: true })
  await expect(select.locator('option')).toHaveCount(1)
  await expect(select.locator('option')).toHaveAttribute('value', 'KE')
})

test('support routes enquiries to the selected team and learning topics expand', async ({
  page,
}) => {
  await page.goto('/#/support')
  await page
    .getByLabel('Choose an enquiry type', { exact: true })
    .selectOption('2')
  await expect(page.locator('.enquiry-picker a')).toHaveAttribute(
    'href',
    'mailto:support@xpresstend.com?subject=Compliance%20enquiry',
  )
  await page.goto('/#/philanthropy')
  const topic = page.locator('.learning-topics details').first()
  await topic.locator('summary').click()
  await expect(topic).toHaveAttribute('open', '')
  await expect(topic).toContainText('Make a plan for each dollar')
  await expect(page.locator('.xt-river-photo')).toHaveAttribute(
    'href',
    /river-habitat.webp$/,
  )
  await expect(page.locator('.xt-bird-folded-wing image')).toHaveAttribute(
    'href',
    /wagtail-poses.webp$/,
  )
})

test('a non-ready sanctions dataset is reported accurately and recovers on refresh', async ({
  page,
}) => {
  let checks = 0
  await page.route('**/api/**', (route) => {
    if (
      new URL(route.request().url()).pathname ===
      '/api/compliance/sanctions-status'
    ) {
      checks++
      return route.fulfill({
        json: {
          ready: checks > 1,
          checkedAt: checks > 1 ? '2026-10-15T00:00:00Z' : null,
        },
      })
    }
    return route.fulfill({ status: 401, json: { error: 'unauthorized' } })
  })
  await page.goto('/#/compliance')
  const panel = page.locator('.institutional-status')
  await expect(panel.getByRole('status')).toContainText(
    'Current sanctions data availability could not be verified.',
  )
  await expect(panel.getByRole('status')).not.toContainText('Checking')
  await panel
    .getByRole('button', { name: 'Refresh status', exact: true })
    .click()
  await expect(panel.getByRole('status')).toContainText(
    'A current official OFAC dataset is loaded',
  )
  await expect(panel.getByRole('status')).not.toContainText(
    'could not be verified',
  )
  expect(checks).toBe(2)
})

test('historical recipients retain their destination identity without inheriting an active market', async ({
  page,
}) => {
  const requests = await mockAccount(page, {
    recipients: [{ ...savedRecipient, country: 'SO' }],
  })
  await page.goto('/#/send')
  await page.getByRole('button', { name: /Choose a recipient/ }).click()
  await page.getByRole('button', { name: /Test Recipient/ }).click()
  await page.getByLabel('You Send', { exact: true }).fill('100')
  await expect(page.locator('.product-phone')).toContainText('🌐')
  await expect(page.locator('.product-phone')).not.toContainText('🇰🇪')
  await expect(
    page.getByRole('button', { name: 'Continue', exact: true }),
  ).toBeDisabled()
  await page.goto('/#/review')
  await expect(page.locator('.product-phone')).toContainText(
    'Archived destination',
  )
  await expect(page.locator('.product-phone')).not.toContainText('Kenya')
  expect(requests.filter((request) => request.method === 'POST')).toEqual([])
})
