import { spawn } from 'node:child_process'
import { delimiter, join } from 'node:path'
import { expect, it } from 'vitest'
import { scrubbedParentEnv, type SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import { Config, machineOf, resolveFeishuBot, workerProbe } from '../src/deployment.ts'
import { workerBin } from '../src/infra/environment.ts'
import { testMachine } from './fixtures/deployment.ts'

it('accepts Windows drive and UNC state directories while rejecting relative paths', () => {
  for (const stateDir of ['C:/Users/agent/state', 'C:\\Users\\agent\\state', '\\\\server\\share\\state', '/srv/agent/state']) {
    expect(machineOf(Config({ stateDir })).stateDir).toBe(stateDir)
  }
  for (const stateDir of ['state', 'C:state', '~/state']) expect(() => Config({ stateDir })).toThrow()
})

it('probes the executable directly with native environment overrides and no env utility', async () => {
  const stateDir = join(process.cwd(), '.artifacts', 'probe-state')
  const shim = workerBin(stateDir)
  const original = process.env.PATH
  const seen: { argv: string[]; env?: NodeJS.ProcessEnv }[] = []
  const subprocess = { spawn(spec: { argv: string[]; env?: NodeJS.ProcessEnv; cwd: string; signal: AbortSignal }) {
    seen.push(spec)
    const child = spawn(spec.argv[0]!, spec.argv.slice(1), { cwd: spec.cwd, signal: spec.signal,
      env: { ...scrubbedParentEnv(), ...spec.env }, windowsHide: true })
    let stdout = '', stderr = ''
    child.stdout.on('data', chunk => { stdout += String(chunk) })
    child.stderr.on('data', chunk => { stderr += String(chunk) })
    const done = new Promise((resolve, reject) => {
      child.on('error', reject)
      child.on('close', exitCode => resolve({ exitCode }))
    })
    return { done, collected: { stdout: { readFrom: () => ({ text: stdout }) }, stderr: { readFrom: () => ({ text: stderr }) } } }
  } } as unknown as SubprocessRuntime
  try {
    process.env.PATH = [shim, original ?? ''].join(delimiter)
    const probe = workerProbe(subprocess, stateDir, process.cwd(), new AbortController().signal)
    const output = await probe([process.execPath, '-e', 'console.log(JSON.stringify({path:process.env.PATH,flag:process.env.PROBE_FLAG}))'], { PROBE_FLAG: 'works', PATH: shim })
    const value = JSON.parse(output) as { path: string; flag: string }
    expect(value.flag).toBe('works')
    expect(value.path.split(delimiter)).not.toContain(shim)
    expect(seen[0]!.argv[0]).toBe(process.execPath)
    expect(seen[0]!.env?.PATH).toBe(value.path)
    await expect(probe([process.execPath, '-e', 'process.stderr.write("probe failed");process.exit(3)']))
      .rejects.toMatchObject({ message: 'probe failed', exitCode: 3 })
  } finally {
    if (original === undefined) delete process.env.PATH
    else process.env.PATH = original
  }
})

it('passes Feishu notifier variables separately from executable arguments', async () => {
  const calls: { argv: string[]; env?: Record<string, string> }[] = []
  const result = await resolveFeishuBot(testMachine(), { cli: process.execPath }, async (argv, env) => {
    calls.push({ argv, env })
    if (argv[1] === 'auth') return JSON.stringify({ appId: 'cli_test', identities: { bot: { status: 'ready' } } })
    if (argv[1] === 'config') return 'strict-mode: bot'
    return JSON.stringify({ bot: { open_id: 'ou_test', app_name: 'Test' } })
  })
  expect(result?.botId).toBe('ou_test')
  expect(calls).toHaveLength(3)
  for (const call of calls) {
    expect(call.argv[0]).toBe(process.execPath)
    expect(call.env).toEqual({ LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1', LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1' })
  }
})
