#!/usr/bin/env node
/**
 * Creates the first staff account.
 *
 *   node scripts/create-admin.mjs "you@xpresstend.com" "Full Name" owner
 *
 * Prints the SQL to run with `wrangler d1 execute`. The password is generated
 * here and shown once — it is never written to a file or into the repository.
 */
import { webcrypto as crypto } from 'node:crypto'

const [email, name, role = 'owner'] = process.argv.slice(2)
if (!email || !name) {
  console.error('usage: create-admin.mjs <email> <name> [viewer|agent|compliance|owner]')
  process.exit(1)
}

const ITERATIONS = 210_000
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const rand = (n) => hex(crypto.getRandomValues(new Uint8Array(n)))

// Ambiguous characters removed so the password can be read aloud or retyped.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
const password = [...crypto.getRandomValues(new Uint8Array(24))]
  .map((b) => ALPHABET[b % ALPHABET.length]).join('')

const pepper = process.env.SESSION_PEPPER ?? ''
if (!pepper) {
  console.error('\nWARNING: SESSION_PEPPER is not set in this shell.')
  console.error('It must match the Worker secret or this login will fail.\n')
}

const salt = rand(16)
const key = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(password + pepper), 'PBKDF2', false, ['deriveBits'])
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
  key, 256)

const now = new Date().toISOString()
console.log(`
-- Run with:
--   npx wrangler d1 execute xpresstend-production --remote --command "<the SQL below>"

INSERT INTO admins (id, email, password_hash, password_salt, password_iterations,
                    name, role, status, created_at, updated_at)
VALUES ('adm_${rand(12)}', '${email.toLowerCase()}', '${hex(bits)}', '${salt}', ${ITERATIONS},
        '${name.replace(/'/g, "''")}', '${role}', 'active', '${now}', '${now}');

-- Sign in at https://xpresstend.com/admin with:
--   email:    ${email}
--   password: ${password}
--
-- This password is shown once. Store it in a password manager now.
`)
