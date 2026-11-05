/** Relative orchestrator client. The Vite proxy supplies Host and Origin. */
import { useCallback, useEffect, useRef, useState } from 'react'

export const POLL_MS = 4000

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

/** `path` is the segment after `/orchestrator/api/`, such as `state` or `executor/pause`. */
export async function api(path: string, method = 'GET', body?: Json): Promise<Json> {
  if (path.startsWith('/') || path.includes('://')) throw new ApiError('API path must stay under /orchestrator/api/.', 0)
  const headers: Record<string, string> = { 'x-orchestrator-request': '1', accept: 'application/json' }
  const init: RequestInit = { method, headers, cache: 'no-store' }
  if (body !== undefined) {
    headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  let response: Response
  try {
    response = await fetch(`/orchestrator/api/${path}`, init)
  } catch {
    throw new ApiError('The orchestrator did not answer through the dev server proxy. Start Host on loopback port 3082.', 0)
  }
  const text = await response.text()
  let value: Json
  try { value = text ? JSON.parse(text) as Json : {} } catch {
    throw new ApiError('The orchestrator answer was not JSON.', response.status)
  }
  if (!response.ok) {
    const refused = response.status === 502 || response.status === 503 || response.status === 504
    const message = value && typeof value === 'object' && !Array.isArray(value) && typeof value.error === 'string'
      ? value.error : refused
        ? 'The orchestrator did not answer through the dev server proxy. Start Host on loopback port 3082.'
        : `Request failed (${response.status}).`
    throw new ApiError(message, response.status)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError('The orchestrator returned a non-object JSON body.', response.status)
  return value
}

export interface Snapshot { state: Json; overview: Json }

/** State first, then overview, so the pair is one read. */
export async function loadSnapshot(): Promise<Snapshot> {
  const state = await api('state')
  const overview = await api('overview')
  return { state, overview }
}

/**
 * Poll state and overview while the browser tab is visible.
 * Keeps the last complete pair when a later read fails.
 */
export function useSnapshot(intervalMs = POLL_MS) {
  const [data, setData] = useState<Snapshot>()
  const [error, setError] = useState<Error>()
  const [at, setAt] = useState<string>()
  const [loading, setLoading] = useState(true)
  const reloadRef = useRef<() => Promise<void>>(async () => {})
  useEffect(() => {
    let active = true
    let timer = 0
    let queue = Promise.resolve()
    const once = async () => {
      try {
        const value = await loadSnapshot()
        if (!active) return
        setData(value)
        setError(undefined)
        setAt(new Date().toISOString())
      } catch (failure) {
        if (!active) return
        setError(failure instanceof Error ? failure : new Error(String(failure)))
      } finally {
        if (active) setLoading(false)
      }
    }
    const run = () => {
      queue = queue.then(async () => {
        window.clearTimeout(timer)
        if (!active || document.hidden) return
        await once()
        if (!active || document.hidden) return
        timer = window.setTimeout(() => { void run() }, intervalMs)
      })
      return queue
    }
    reloadRef.current = () => run()
    const onVisibility = () => { if (!document.hidden) void run() }
    void run()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      active = false
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs])
  const reload = useCallback(() => reloadRef.current(), [])
  return { data, error, at, loading, reload }
}
