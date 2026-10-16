import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import {
  withMarketDocumentHeaders,
  withSecurityHeaders,
} from '../src/headers.ts'

let worker: { fetch: Function }
let directory: string
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'xpresstend-market-main-'))
  const outfile = join(directory, 'worker.mjs')
  await build({
    entryPoints: [new URL('../src/index.ts', import.meta.url).pathname],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    logLevel: 'silent',
  })
  worker = (await import(pathToFileURL(outfile).href)).default
})
after(async () => {
  if (directory) await rm(directory, { recursive: true, force: true })
})

function assertMainPolicy(response: Response) {
  const policy = response.headers.get('content-security-policy')!
  assert.match(policy, /script-src 'self';/)
  assert.match(policy, /connect-src 'self';/)
  assert.match(policy, /frame-ancestors 'none'/)
  assert.doesNotMatch(policy, /tradingview/)
  assert.deepEqual(
    policy
      .split(';')
      .map((item) => item.trim())
      .filter((item) => item.startsWith('frame-src ')),
    ['frame-src https://xpresstend-market.shrill-king-ef4e.workers.dev'],
  )
  assert.equal(response.headers.get('x-frame-options'), 'DENY')
}

test('normal pages keep first-party scripts and cannot be framed', () => {
  assertMainPolicy(withSecurityHeaders(new Response('site')))
})

test('main HTML and asset fallback URLs never receive the provider script policy', async () => {
  const env = {
    ENVIRONMENT: 'development',
    ASSETS: {
      fetch: async () =>
        new Response('<!doctype html><title>App</title>', {
          headers: { 'content-type': 'text/html' },
        }),
    },
  }
  for (const path of [
    '/',
    '/index.html',
    '/market/dollar-index/',
    '/unlisted.html',
  ]) {
    const response = await worker.fetch(
      new Request(`https://xpresstend.com${path}`),
      env,
      {},
    )
    assert.equal(response.status, 200, path)
    assertMainPolicy(response)
  }
})

test('both legacy quote document spellings redirect safely to the isolated origin with their query', async () => {
  let assetCalls = 0
  const env = {
    ENVIRONMENT: 'development',
    ASSETS: {
      fetch: async () => {
        assetCalls++
        return new Response('must not serve')
      },
    },
  }
  for (const path of ['/market/dollar-index', '/market/dollar-index.html']) {
    for (const method of ['GET', 'HEAD']) {
      const response = await worker.fetch(
        new Request(`https://xpresstend.com${path}?locale=pt&theme=light`, {
          method,
        }),
        env,
        {},
      )
      assert.equal(response.status, 302)
      assert.equal(
        response.headers.get('location'),
        'https://xpresstend-market.shrill-king-ef4e.workers.dev/dollar-index?locale=pt&theme=light',
      )
      assertMainPolicy(response)
    }
    const response = await worker.fetch(
      new Request(`https://xpresstend.com${path}`, { method: 'POST' }),
      env,
      {},
    )
    assert.equal(response.status, 405)
    assert.equal(response.headers.get('location'), null)
    assertMainPolicy(response)
  }
  assert.equal(assetCalls, 0)
})

test('only the isolated document policy permits the provider and the configured app frame parents', () => {
  const response = withMarketDocumentHeaders(new Response('widget'))
  const policy = response.headers.get('content-security-policy')!
  assert.match(
    policy,
    /script-src 'self' https:\/\/widgets\.tradingview-widget\.com;/,
  )
  assert.match(policy, /wss:\/\/\*\.tradingview\.com/)
  assert.deepEqual(
    policy
      .split(';')
      .map((item) => item.trim())
      .filter((item) => item.startsWith('frame-src ')),
    ['frame-src https://widgets.tradingview-widget.com'],
  )
  assert.match(
    policy,
    /frame-ancestors https:\/\/xpresstend\.com https:\/\/www\.xpresstend\.com/,
  )
  assert.doesNotMatch(policy, /script-src[^;]*unsafe-inline/)
  assert.match(policy, /form-action 'none'/)
  assert.match(policy, /object-src 'none'/)
  assert.equal(response.headers.get('x-frame-options'), null)
  assert.equal(
    response.headers.get('permissions-policy'),
    'camera=(), microphone=(), geolocation=(), payment=()',
  )
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.ok(response.headers.get('strict-transport-security'))
})
