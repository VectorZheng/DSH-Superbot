/** Present the fields Host actually returned. */
import type { ReactNode } from 'react'
import type { Json } from './api.ts'
import { listOf, objectOf, problemLine, show } from './read.ts'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="neo-card"><h2 className="neo-card-title">{title}</h2>{children}</section>
}

export function Banner({ error }: { error: Error | undefined }) {
  if (!error) return null
  return <p className="neo-banner neo-danger" role="alert">{error.message}</p>
}

export function Numbers({ value, keys }: { value: Json | undefined; keys: readonly string[] }) {
  if (value === undefined) return <p className="neo-empty">missing</p>
  const record = objectOf(value)
  if (!record) return <pre className="neo-json">{JSON.stringify(value, null, 2)}</pre>
  return <div className="neo-stats">{keys.map(key => <div key={key} className="neo-stat">
    <span className="neo-stat-label">{key}</span>
    <span className="neo-stat-value">{show(record[key])}</span>
  </div>)}</div>
}

export function SetupField({ label, value }: { label: string; value: Json | undefined }) {
  if (value === undefined) return <p className="neo-empty">{label}: missing</p>
  if (value === null) return <p className="neo-ok">{label}: null</p>
  const record = objectOf(value)
  if (!record) return <pre className="neo-json">{JSON.stringify(value, null, 2)}</pre>
  return <div className="neo-banner neo-danger">
    <p className="neo-row-title">{label}</p>
    <dl className="neo-kv">
      <dt>place</dt><dd>{show(record.place)}</dd>
      <dt>code</dt><dd>{show(record.code)}</dd>
      <dt>detail</dt><dd>{show(record.detail)}</dd>
      <dt>values</dt><dd>{show(record.values)}</dd>
    </dl>
  </div>
}

export function Problems({ problems }: { problems: Json | undefined }) {
  if (problems === undefined) return <p className="neo-empty">missing</p>
  const list = listOf(problems)
  if (!list) return <pre className="neo-json">{JSON.stringify(problems, null, 2)}</pre>
  if (!list.length) return <p className="neo-empty">none</p>
  return <ul className="neo-list">{list.map((item, index) => {
    const line = problemLine(item)
    return <li key={index} className="neo-row">
      <div className="neo-row-title"><span className="neo-kind">{line.kind}</span><span>{line.title}</span></div>
      {line.detail ? <p className="neo-detail">{line.detail}</p> : null}
    </li>
  })}</ul>
}

export function People({ person }: { person: Json | undefined }) {
  if (person === undefined) return <p className="neo-empty">missing</p>
  const list = listOf(person)
  if (!list) return <pre className="neo-json">{JSON.stringify(person, null, 2)}</pre>
  if (!list.length) return <p className="neo-empty">none</p>
  return <ul className="neo-list">{list.map((item, index) => {
    const record = objectOf(item)
    if (!record) return <li key={index} className="neo-row"><pre className="neo-json">{JSON.stringify(item)}</pre></li>
    const note = objectOf(record.note)
    const id = typeof record.id === 'string' ? record.id : String(index)
    return <li key={id} className="neo-row">
      <div className="neo-row-title"><span>{show(record.id)}</span><span>{typeof record.title === 'string' ? record.title : show(record.title)}</span></div>
      <p className="neo-hint">stage {show(record.stage)} / {show(record.action)}</p>
      {note ? <p className={note.error === true ? 'neo-error' : 'neo-detail'}>{show(note.text)}</p> : null}
    </li>
  })}</ul>
}

export function HealthList({ health }: { health: Json | undefined }) {
  if (health === undefined) return <p className="neo-empty">missing</p>
  const record = objectOf(health)
  if (!record) return <pre className="neo-json">{JSON.stringify(health, null, 2)}</pre>
  const names = Object.keys(record).sort((a, b) => a.localeCompare(b))
  if (!names.length) return <p className="neo-empty">no entries</p>
  return <ul className="neo-list">{names.map(name => {
    const entry = objectOf(record[name])
    const state = entry && typeof entry.state === 'string' ? entry.state : 'missing'
    return <li key={name} className="neo-row">
      <div className="neo-row-title">
        <span className="neo-dot" data-state={state} />
        <span>{name}</span>
        <span className="neo-kind">{state}</span>
      </div>
      <p className="neo-detail">{entry ? show(entry.detail) : show(record[name])}</p>
      {entry?.at !== undefined ? <p className="neo-hint">at {show(entry.at)}</p> : null}
      {entry?.code !== undefined ? <p className="neo-hint">code {show(entry.code)}</p> : null}
    </li>
  })}</ul>
}

export function Accounts({ value }: { value: Json | undefined }) {
  if (value === undefined) return <p className="neo-empty">accounts: missing</p>
  if (value === null) return <p className="neo-empty">accounts: null</p>
  const record = objectOf(value)
  if (!record) return <pre className="neo-json">{JSON.stringify(value, null, 2)}</pre>
  return <dl className="neo-kv">
    <dt>repository</dt><dd>{show(record.repository)}</dd>
    <dt>agent</dt><dd>{show(record.agent)}</dd>
    <dt>feishu</dt><dd>{record.feishu === null ? 'null' : show(record.feishu)}</dd>
  </dl>
}

export function Raw({ value }: { value: Json | undefined }) {
  return <pre className="neo-json">{value === undefined ? 'missing' : JSON.stringify(value, null, 2)}</pre>
}
