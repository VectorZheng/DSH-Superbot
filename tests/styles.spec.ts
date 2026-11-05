import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const dir = join(process.cwd(), 'src/client')
const css = readFileSync(join(dir, 'client.css'), 'utf8')
const code = readdirSync(dir).filter(name => /\.tsx?$/.test(name)).map(name => readFileSync(join(dir, name), 'utf8')).join('\n')

it('styles only classes a component uses', () => {
  // Template literals like `dt-btn-${variant}` match any class with that prefix.
  const prefixes = [...code.matchAll(/(dt-[\w-]*-)\$\{/g)].map(match => match[1]!)
  const used = (name: string) => new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(code) || prefixes.some(prefix => name.startsWith(prefix))
  const classes = new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.(dt-[\w-]+)/g)].map(match => match[1]!))
  expect([...classes].filter(name => !used(name))).toEqual([])
})

it('keeps the neo-brutalist surface: hard shadows, square corners, snap timing', () => {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const token of ['#ff006e', '#ffff00', '#ccff00', '#00d9ff']) expect(body.toLowerCase()).toContain(token)
  expect(body).toMatch(/--dt-dur:\s*150ms/)
  expect(body).toMatch(/--dt-ease:\s*ease-out/)
  expect(body).not.toMatch(/backdrop-filter|color-mix\(|linear-gradient|radial-gradient|--dsw-alias-|--dsw-elevation|--dsw-shadow|--dsw-mask/)
  const shadows = [...body.matchAll(/box-shadow:\s*([^;}]+)/g)].map(match => match[1]!)
  expect(shadows.length).toBeGreaterThan(0)
  for (const shadow of shadows) {
    if (/^\s*none\s*$/.test(shadow)) continue
    for (const part of shadow.split(',').map(item => item.trim())) {
      // Blur and spread are the third and fourth lengths. Unitless 0 matches the mock (`Npx Npx 0 0`).
      const lengths = [...part.matchAll(/-?\d*\.?\d+px|\b0\b/g)].map(match => match[0] === '0' ? '0px' : match[0])
      expect(lengths.length, part).toBeGreaterThanOrEqual(4)
      expect(lengths[2], part).toBe('0px')
      expect(lengths[3], part).toBe('0px')
    }
  }
  for (const radius of [...body.matchAll(/border-radius:\s*([^;}]+)/g)].map(match => match[1]!.trim())) {
    expect(radius === '0' || radius === '50%').toBe(true)
  }
  for (const transition of [...body.matchAll(/transition:\s*([^;}]+)/g)].map(match => match[1]!)) {
    if (!/(transform|box-shadow)/.test(transition)) continue
    expect(transition).toMatch(/150ms|var\(--dt-dur\)/)
    expect(transition).toMatch(/ease-out|var\(--dt-ease\)/)
  }
})

it('locks the page to the viewport and scrolls only the main body', () => {
  const page = /\.dt-page \{([^}]*)\}/.exec(css)?.[1]
  const column = /\.dt-page > \.dt-column \{([^}]*)\}/.exec(css)?.[1]
  const main = /\.dt-main \{([^}]*)\}/.exec(css)?.[1]
  const head = /\.dt-head \{([^}]*)\}/.exec(css)?.[1]
  const tabs = /\.dt-page \.dt-tabs \{([^}]*)\}/.exec(css)?.[1]
  const settings = /\.dt-settings \{([^}]*)\}/.exec(css)?.[1]
  const settingsNav = /\.dt-settings-nav \{([^}]*)\}/.exec(css)?.[1]
  const settingsBody = /\.dt-settings-body \{([^}]*)\}/.exec(css)?.[1]
  expect(page).toMatch(/display:\s*flex/)
  expect(page).toMatch(/flex-direction:\s*column/)
  expect(page).toMatch(/overflow:\s*hidden/)
  expect(page).not.toMatch(/overflow:\s*auto/)
  expect(column).toMatch(/overflow:\s*hidden/)
  expect(column).toMatch(/min-height:\s*0/)
  expect(column).toMatch(/flex:\s*1 1 auto/)
  expect(column).not.toMatch(/overflow:\s*auto/)
  expect(head).toMatch(/flex:\s*none/)
  expect(tabs).toMatch(/flex:\s*none/)
  expect(main).toMatch(/overflow:\s*auto/)
  expect(main).toMatch(/flex:\s*1/)
  expect(main).toMatch(/min-height:\s*0/)
  // Settings: group nav outside form scroller; only body scrolls (PR #4 latest).
  expect(settings).toMatch(/overflow:\s*hidden/)
  expect(settings).toMatch(/min-height:\s*0/)
  expect(settingsNav).toMatch(/position:\s*static/)
  expect(settingsNav).not.toMatch(/position:\s*sticky/)
  expect(settingsBody).toMatch(/overflow:\s*auto/)
  expect(settingsBody).toMatch(/min-height:\s*0/)
  expect(css).toMatch(/\.dt-main:has\(> \.dt-settings\) \{[^}]*overflow:\s*hidden/)
  const navRules = css.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(text => text.trim()).filter(text => text.startsWith('.dt-settings-nav {'))
  expect(navRules.every(line => !line.includes('position: sticky'))).toBe(true)
})

it('writes one rule per line, each selector once within its block', () => {
  const blocks: string[][] = [[]]
  for (const line of css.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(text => text.trim()).filter(Boolean)) {
    if (line === '}') { blocks.pop(); continue }
    if (/^@(media|container|supports)\b.*\{$/.test(line)) { blocks.push([]); continue }
    // A rule, or a keyframes rule with its steps, opens and closes on its line.
    expect(line).toMatch(/^[^{}]+\{[^{}]*\}$|^@keyframes [\w-]+ \{( [^{}]+ \{[^{}]*\})+ \}$/)
    if (line.startsWith('@')) continue
    const selector = line.slice(0, line.indexOf('{')).trim()
    expect(blocks.at(-1)).not.toContain(selector)
    blocks.at(-1)!.push(selector)
  }
})
