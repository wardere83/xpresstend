import test from 'node:test'
import assert from 'node:assert/strict'
import { withSecurityHeaders } from '../src/headers.ts'

test('normal pages keep first-party scripts and cannot be framed', () => {
  const response = withSecurityHeaders(new Response('site'))
  const policy = response.headers.get('content-security-policy')!
  assert.match(policy, /script-src 'self';/)
  assert.match(policy, /connect-src 'self';/)
  assert.match(policy, /frame-ancestors 'none'/)
  assert.doesNotMatch(policy, /tradingview/)
  assert.equal(response.headers.get('x-frame-options'), 'DENY')
})

test('the quote frame permits the widget provider while retaining other security headers', () => {
  const response = withSecurityHeaders(new Response('widget'), true)
  const policy = response.headers.get('content-security-policy')!
  assert.match(
    policy,
    /script-src 'self' https:\/\/widgets\.tradingview-widget\.com;/,
  )
  assert.match(policy, /wss:\/\/\*\.tradingview\.com/)
  assert.match(policy, /frame-ancestors 'self'/)
  assert.doesNotMatch(policy, /script-src[^;]*unsafe-inline/)
  assert.match(policy, /object-src 'none'/)
  assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.ok(response.headers.get('strict-transport-security'))
})
