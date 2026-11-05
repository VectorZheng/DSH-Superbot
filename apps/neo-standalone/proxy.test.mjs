import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const read = name => readFileSync(join(root, name), 'utf8')

test('vite proxy matches the 009a freeze', () => {
  const config = read('vite.config.ts')
  assert.match(config, /host:\s*'127\.0\.0\.1'/)
  assert.match(config, /port:\s*5179/)
  assert.match(config, /strictPort:\s*true/)
  assert.match(config, /cors:\s*false/)
  assert.match(config, /'\/orchestrator'/)
  assert.match(config, /target:\s*'http:\/\/127\.0\.0\.1:3082'/)
  assert.match(config, /changeOrigin:\s*true/)
  assert.match(config, /setHeader\(\s*'x-orchestrator-request',\s*'1'\s*\)/)
  assert.match(config, /setHeader\(\s*'origin',\s*'http:\/\/127\.0\.0\.1:3082'\s*\)/)
})

test('viewport lock hides document scroll and scrolls the column', () => {
  const css = read('src/styles.css')
  const frame = /html,\s*body,\s*#root\s*\{([^}]*)\}/.exec(css)?.[1]
  assert.ok(frame)
  assert.match(frame, /height:\s*100%/)
  assert.match(frame, /overflow:\s*hidden/)
  const page = /\.neo-page\s*\{([^}]*)\}/.exec(css)?.[1]
  assert.ok(page)
  assert.match(page, /display:\s*flex/)
  assert.match(page, /flex-direction:\s*column/)
  assert.match(page, /overflow:\s*hidden/)
  const column = /\.neo-column\s*\{([^}]*)\}/.exec(css)?.[1]
  assert.ok(column)
  assert.match(column, /overflow:\s*auto/)
  assert.match(column, /min-height:\s*0/)
  assert.match(column, /flex:\s*1 1 auto/)
  assert.match(css, /border-radius:\s*0/)
  assert.match(css, /box-shadow:[^;]*\b0\s+0\b/)
})

test('the page calls relative orchestrator paths only', () => {
  const files = readdirSync(join(root, 'src')).filter(name => /\.(ts|tsx)$/.test(name))
  const source = files.map(name => read(join('src', name))).join('\n')
  const stateAt = source.indexOf("await api('state')")
  const overviewAt = source.indexOf("await api('overview')")
  assert.ok(stateAt >= 0 && overviewAt > stateAt)
  assert.match(source, /\/orchestrator\/api\/\$\{path\}/)
  assert.match(source, /'x-orchestrator-request':\s*'1'/)
  assert.match(source, /cache:\s*'no-store'/)
  assert.match(source, /accept:\s*'application\/json'/)
  assert.match(source, /api\('executor\/pause',\s*'POST',\s*body\)/)
  assert.match(source, /POLL_MS = 4000/)
  assert.doesNotMatch(source, /https?:\/\/(127\.0\.0\.1|localhost):3082/)
  assert.doesNotMatch(source, /fetch\(\s*['"`]https?:/)
})
