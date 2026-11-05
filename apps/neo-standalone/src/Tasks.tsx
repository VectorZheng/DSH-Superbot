import { useEffect, useState } from 'react'
import { api, type Json } from './api.ts'
import { objectOf } from './read.ts'

type Status = 'completed' | 'deferred' | 'incomplete'
const labels: Record<Status, string> = { completed: '已完成', deferred: '推迟', incomplete: '未完成' }
interface Task { id: string; title: string; summary?: string; stage?: string; review?: { status: Status; at: string } }

/** Human decisions use the same persisted Host ticket routes as the management panel. */
export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<{ task: Task; status?: Status }>()
  const [offset, setOffset] = useState(0)
  const [more, setMore] = useState(false)
  async function load() {
    const [open, ended] = await Promise.all([api(`tickets?state=open&limit=50&offset=${offset}`), api(`tickets?state=ended&limit=50&offset=${offset}`)])
    const rows = [open, ended].flatMap(value => {
      const list = objectOf(value)
      return Array.isArray(list?.items) ? list.items : []
    })
    setTasks(rows as unknown as Task[])
    setMore([open, ended].some(value => typeof objectOf(value)?.next_offset === 'number'))
    setError('')
  }
  useEffect(() => {
    let active = true
    setLoading(true)
    const run = () => load().catch(failure => { if (active) setError(String(failure instanceof Error ? failure.message : failure)) }).finally(() => { if (active) setLoading(false) })
    void run()
    const timer = window.setInterval(() => { if (!document.hidden && !busy) void run() }, 5000)
    return () => { active = false; window.clearInterval(timer) }
  }, [offset, busy])
  async function confirm() {
    if (!pending || busy) return
    setBusy(true)
    try {
      await api(`tickets/${encodeURIComponent(pending.task.id)}/${pending.status ? 'status' : 'resume'}`, pending.status ? 'PUT' : 'POST', pending.status ? { status: pending.status } as Json : undefined)
      await load()
      setPending(undefined)
    } catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)) }
    finally { setBusy(false) }
  }
  return <section className="neo-section">
    <h2>任务与人工处理</h2>
    <p>检查任务结果后，选择已完成、推迟或未完成。推迟和未完成会停止本工单，等待手动恢复；不会合并 PR 或发送外部消息。</p>
    {error && <p className="neo-error" role="alert">{error}</p>}
    {loading && <p role="status">正在读取任务…</p>}
    {!loading && !tasks.length && <p>当前没有工单。请先通过已配置的 GitHub 或飞书来源发起任务。</p>}
    {tasks.map(task => <article key={task.id} className="neo-task">
      <h3>{task.title}</h3>
      <p>状态：{task.review ? labels[task.review.status] : task.stage === 'ended' ? '执行已结束，待人工确认' : '未标记'} · {task.id}</p>
      {task.summary && <details><summary>查看执行结果</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{task.summary}</pre></details>}
      <div className="neo-task-actions">
        {(['completed', 'deferred', 'incomplete'] as const).map(status => <button type="button" key={status} disabled={busy || task.review?.status === status}
          onClick={() => setPending({ task, status })}>{labels[status]}</button>)}
        {task.review && task.review.status !== 'completed' && <button type="button" disabled={busy} onClick={() => setPending({ task })}>恢复此任务</button>}
      </div>
    </article>)}
    {pending && <div className="neo-task-confirm" role="dialog" aria-modal="true" aria-labelledby="task-confirm-title">
      <h3 id="task-confirm-title">{pending.status ? `确认标记为“${labels[pending.status]}”` : '确认恢复任务'}</h3>
      <p>{pending.task.title}</p>
      <p>{pending.status ? '这会停止此工单的执行，不影响其他任务。' : '恢复前会重新检查原授权，然后继续此工单。'}</p>
      <button type="button" disabled={busy} onClick={() => { void confirm() }}>{busy ? '正在保存…' : '确认'}</button>
      <button type="button" disabled={busy} onClick={() => setPending(undefined)}>取消</button>
    </div>}
    <div className="neo-task-actions">
      <button type="button" disabled={busy || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 50))}>上一页</button>
      <span>第 {offset / 50 + 1} 页</span>
      <button type="button" disabled={busy || !more} onClick={() => setOffset(value => value + 50)}>下一页</button>
    </div>
  </section>
}
