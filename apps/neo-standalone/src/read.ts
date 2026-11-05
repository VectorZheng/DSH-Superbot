/** Read orchestrator JSON without inventing fields that were not sent. */
import type { Json } from './api.ts'

export function objectOf(value: Json | undefined): { [key: string]: Json } | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value
}

export function listOf(value: Json | undefined): Json[] | undefined {
  return Array.isArray(value) ? value : undefined
}

export function textOf(value: Json | undefined): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  const record = objectOf(value)
  if (!record) return undefined
  if (typeof record.en === 'string') return record.en
  if (typeof record.zh === 'string') return record.zh
  return undefined
}

/** Render a field as Host sent it. Missing and null stay distinct. */
export function show(value: Json | undefined): string {
  if (value === undefined) return 'missing'
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

export function boolOf(value: Json | undefined): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

export function healthSummary(health: Json | undefined): string {
  if (health === undefined) return 'missing'
  const record = objectOf(health)
  if (!record) return 'not an object'
  const counts = new Map<string, number>()
  for (const value of Object.values(record)) {
    const entry = objectOf(value)
    const state = entry && typeof entry.state === 'string' ? entry.state : 'unknown'
    counts.set(state, (counts.get(state) ?? 0) + 1)
  }
  if (!counts.size) return 'no entries'
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([state, count]) => `${count} ${state}`).join(', ')
}

export function problemLine(item: Json): { kind: string; title: string; detail: string } {
  const record = objectOf(item)
  if (!record) return { kind: 'unknown', title: show(item), detail: '' }
  const kind = typeof record.kind === 'string' ? record.kind : 'unknown'
  const source = objectOf(record.source)
  const thread = objectOf(record.thread)
  const outgoing = objectOf(record.outgoing)
  const health = objectOf(source?.health)
  const named = textOf(thread?.title) ?? (typeof thread?.key === 'string' ? thread.key : 'thread')
  switch (kind) {
    case 'setup':
      return { kind, title: `${show(record.place)} / ${show(record.code)}`, detail: prose(record.detail) }
    case 'no-source':
      return { kind, title: 'No source is running', detail: '' }
    case 'no-allowed':
      return { kind, title: 'No allowed sender', detail: '' }
    case 'executor-paused':
      return { kind, title: 'Executor is paused', detail: '' }
    case 'runtime-error':
      return { kind, title: typeof record.name === 'string' ? record.name : show(record.name), detail: prose(record.detail) }
    case 'source-error':
      return { kind, title: textOf(source?.title) ?? (typeof source?.id === 'string' ? source.id : 'source'),
        detail: [health && typeof health.state === 'string' ? health.state : '', prose(health?.detail)].filter(Boolean).join(': ') }
    case 'eval-overdue':
      return { kind, title: named, detail: '' }
    case 'eval-unavailable':
      return { kind, title: named, detail: textOf(record.reason) ?? prose(record.reason) }
    case 'outgoing':
      return { kind, title: typeof outgoing?.id === 'string' ? outgoing.id : 'reply',
        detail: [prose(outgoing?.error), typeof outgoing?.attempts === 'number' ? `${outgoing.attempts} attempts` : ''].filter(Boolean).join(' · ') }
    default:
      return { kind, title: 'Unrecognized problem', detail: JSON.stringify(record) }
  }
}

function prose(value: Json | undefined): string {
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return ''
  return JSON.stringify(value)
}
