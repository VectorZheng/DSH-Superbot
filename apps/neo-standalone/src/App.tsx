/** Four screens over one live state + overview pair. */
import { useState } from 'react'
import { api, POLL_MS, useSnapshot, type Json, type Snapshot } from './api.ts'
import { boolOf, healthSummary, objectOf, show } from './read.ts'
import { Accounts, Banner, HealthList, Numbers, People, Problems, Raw, Section, SetupField } from './view.tsx'
import { TasksScreen } from './Tasks.tsx'

const SCREENS = ['home', 'state', 'overview', 'tasks', 'pause'] as const
type Screen = typeof SCREENS[number]
const LABELS: Record<Screen, string> = { home: 'Home', state: 'State', overview: 'Overview', tasks: '任务', pause: 'Pause' }
const LOAD_KEYS = ['running', 'queued', 'maxWorkers'] as const
const EXECUTOR_KEYS = ['running', 'queued', 'maxWorkers', 'idle'] as const
const FLOW_KEYS = ['received', 'filtered', 'triggers', 'judged', 'accepted', 'evaluating', 'dropped'] as const

type Live = ReturnType<typeof useSnapshot>

export function App() {
  const live = useSnapshot()
  const [screen, setScreen] = useState<Screen>('home')
  const phase = !live.data ? (live.error ? 'offline' : 'reading') : live.error ? 'stale' : 'live'
  const phaseLabel = { offline: 'Offline', reading: 'Reading', stale: 'Stale', live: 'Live' }[phase]
  return <div className="neo-page">
    <header className="neo-head">
      <div className="neo-brand">
        <h1 className="neo-title"><span className="neo-mark">NEO</span> Demo</h1>
        <p className="neo-sub">State, then overview. Relative /orchestrator/api only.</p>
      </div>
      <p className="neo-live" data-state={phase} role="status">{phaseLabel}</p>
    </header>
    <nav className="neo-tabs" aria-label="Screens">
      {SCREENS.map(item => <button key={item} type="button" className="neo-tab" aria-current={screen === item ? 'page' : undefined}
        onClick={() => setScreen(item)}>{LABELS[item]}</button>)}
    </nav>
    <main className="neo-column" data-screen={screen}>
      <Banner error={live.error} />
      {screen === 'tasks' ? <TasksScreen /> : null}
      {!live.data ? <Waiting loading={live.loading} /> : null}
      {live.data && screen === 'home' ? <Home data={live.data} /> : null}
      {live.data && screen === 'state' ? <StateScreen data={live.data} /> : null}
      {live.data && screen === 'overview' ? <OverviewScreen data={live.data} /> : null}
      {screen === 'pause' ? <PauseControl state={live.data?.state} reload={live.reload} detail /> : null}
      {live.data && screen === 'home' ? <PauseControl state={live.data.state} reload={live.reload} /> : null}
      <Meta live={live} />
    </main>
  </div>
}

function Waiting({ loading }: { loading: boolean }) {
  return <p className="neo-banner">{loading ? 'Reading state, then overview.' : 'No snapshot yet.'}</p>
}

function Home({ data }: { data: Snapshot }) {
  const state = objectOf(data.state)
  const overview = objectOf(data.overview)
  return <>
    {state ? null : <p className="neo-error">state is not an object.</p>}
    <Section title="State">
      <dl className="neo-kv">
        <dt>paused</dt><dd>{state ? show(state.paused) : 'missing'}</dd>
        <dt>health</dt><dd>{healthSummary(state?.health)}</dd>
      </dl>
      <SetupFields setup={state?.setup} />
    </Section>
    {overview ? null : <p className="neo-error">overview is not an object.</p>}
    <Section title="Executor">
      <Numbers value={overview?.executor} keys={EXECUTOR_KEYS} />
    </Section>
    <Section title="Flow">
      <Numbers value={overview?.flow} keys={FLOW_KEYS} />
    </Section>
    <Section title="Problems">
      <Problems problems={overview?.problems} />
    </Section>
    <Section title="Waiting on a person">
      <People person={overview?.person} />
    </Section>
  </>
}

function StateScreen({ data }: { data: Snapshot }) {
  const state = objectOf(data.state)
  const setup = objectOf(state?.setup)
  const machine = objectOf(setup?.machine)
  const paused = boolOf(state?.paused)
  return <>
    {state ? null : <p className="neo-error">state is not an object.</p>}
    <Section title="Paused">
      <p className="neo-status" data-state={paused === undefined ? 'missing' : paused ? 'paused' : 'ready'}>{state ? show(state.paused) : 'missing'}</p>
    </Section>
    <Section title="Load">
      <Numbers value={state?.load} keys={LOAD_KEYS} />
    </Section>
    <Section title="Setup">
      <SetupFields setup={state?.setup} />
      <Accounts value={setup ? setup.accounts : state?.setup === null ? null : undefined} />
      <dl className="neo-kv">
        <dt>masterId</dt><dd>{state ? show(state.masterId) : 'missing'}</dd>
        <dt>stateDir</dt><dd>{machine ? show(machine.stateDir) : state?.setup === null ? 'null' : 'missing'}</dd>
      </dl>
    </Section>
    <Section title="Health">
      <HealthList health={state?.health} />
    </Section>
    <Section title="Raw state">
      <Raw value={data.state} />
    </Section>
  </>
}

function OverviewScreen({ data }: { data: Snapshot }) {
  const overview = objectOf(data.overview)
  return <>
    {overview ? null : <p className="neo-error">overview is not an object.</p>}
    <Section title="Problems">
      <Problems problems={overview?.problems} />
    </Section>
    <Section title="Executor">
      <Numbers value={overview?.executor} keys={EXECUTOR_KEYS} />
    </Section>
    <Section title="Flow">
      <Numbers value={overview?.flow} keys={FLOW_KEYS} />
    </Section>
    <Section title="Waiting on a person">
      <People person={overview?.person} />
    </Section>
    <Section title="Policy">
      <dl className="neo-kv">
        <dt>policyVersion</dt><dd>{overview ? show(overview.policyVersion) : 'missing'}</dd>
      </dl>
    </Section>
    <Section title="Raw overview">
      <Raw value={data.overview} />
    </Section>
  </>
}

function SetupFields({ setup }: { setup: Json | undefined }) {
  if (setup === undefined) return <p className="neo-empty">setup: missing</p>
  if (setup === null) return <p className="neo-empty">setup: null</p>
  const record = objectOf(setup)
  if (!record) return <pre className="neo-json">{JSON.stringify(setup, null, 2)}</pre>
  return <>
    <SetupField label="setup.problem" value={record.problem} />
    <SetupField label="setup.feishuProblem" value={record.feishuProblem} />
  </>
}

function PauseControl({ state, reload, detail = false }: { state: Json | undefined; reload: () => Promise<void>; detail?: boolean }) {
  const known = state !== undefined
  const record = objectOf(state)
  const paused = known ? boolOf(record?.paused) : undefined
  const label = !known ? 'waiting' : paused === undefined ? (record ? 'missing' : 'not an object') : String(paused)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<Json>()
  const [result, setResult] = useState<Json>()
  const [failure, setFailure] = useState<string>()
  const post = async (next: boolean) => {
    const body = { paused: next }
    setBusy(true)
    setSent(body)
    setFailure(undefined)
    try {
      setResult(await api('executor/pause', 'POST', body))
      await reload()
    } catch (error) {
      setResult(undefined)
      setFailure(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }
  return <Section title="Executor pause">
    {detail ? <p className="neo-hint">POST /orchestrator/api/executor/pause with JSON {`{"paused": true}`} or {`{"paused": false}`}.</p> : null}
    <p className="neo-status" data-state={paused === true ? 'paused' : paused === false ? 'ready' : 'missing'}>paused: {label}</p>
    <div className="neo-actions">
      <button type="button" className="neo-btn neo-btn-primary" disabled={busy || paused !== false} onClick={() => { void post(true) }}>Pause</button>
      <button type="button" className="neo-btn neo-btn-acid" disabled={busy || paused !== true} onClick={() => { void post(false) }}>Resume</button>
    </div>
    {busy ? <p className="neo-hint">Sending.</p> : null}
    {sent !== undefined ? <p className="neo-hint">Sent {JSON.stringify(sent)}</p> : null}
    {result !== undefined ? <pre className="neo-json">{JSON.stringify(result, null, 2)}</pre> : null}
    {failure ? <p className="neo-error" role="status">{failure}</p> : null}
  </Section>
}

function Meta({ live }: { live: Live }) {
  return <p className="neo-hint">
    GET /orchestrator/api/state, then GET /orchestrator/api/overview, every {POLL_MS / 1000}s while the browser tab is visible.
    {live.at ? ` Last good read ${live.at}.` : ''}
  </p>
}
