/** Settings tab shell routing between stage settings (Sources, Eval, Execution), Prompts, and Deployment. */
import type { StateView } from './api.ts'
import { DeploymentPage, type DeploymentForm } from './deployment.tsx'
import { EvalSettings } from './eval.tsx'
import { ExecutionSettings } from './execution.tsx'
import { PromptsPage } from './prompts.tsx'
import { usePanel } from './provider.tsx'
import { SETTINGS_GROUPS, settingsRoute, setupPage, type SettingsGroup } from './route.ts'
import { SettingsProvider } from './settings-kit.tsx'
import { SourceSettings } from './source.tsx'
import { SetupMessage } from './widgets.tsx'

const STAGE_GROUPS: readonly SettingsGroup[] = ['source', 'eval', 'execution']
export function SettingsPage({ group, query, state, deploymentForm }: {
  group: SettingsGroup; query: { source?: string; version?: string }; state: StateView; deploymentForm: DeploymentForm
}) {
  const { t, navigate } = usePanel()
  const blocking = state.setup.problem ?? state.setup.feishuProblem
  // The Source and Deployment groups already show the problem on the card that fixes it.
  const onFix = !!blocking && (blocking.place === 'deployment' ? group === 'deployment' : group === 'source')
  const content = (() => {
    switch (group) {
      case 'source': return <SettingsProvider><SourceSettings {...query.source ? { focus: query.source } : {}} /></SettingsProvider>
      case 'eval': return <SettingsProvider><EvalSettings version={query.version} /></SettingsProvider>
      case 'execution': return <SettingsProvider><ExecutionSettings /></SettingsProvider>
      case 'prompts': return <PromptsPage />
      case 'deployment': return <DeploymentPage setup={state.setup} form={deploymentForm} />
    }
  })()
  return <div className="dt-settings">
    <nav className="dt-settings-nav" aria-label={t('tab.settings')}>
      {SETTINGS_GROUPS.map(value => <button key={value} type="button" className="dt-settings-link" data-stage={STAGE_GROUPS.includes(value)
        || undefined}
        aria-current={value === group ? 'page' : undefined} onClick={() => navigate(settingsRoute(value),
          true)}>{t(`settingsGroup.${value}`)}</button>)}
    </nav>
    <div className="dt-settings-body" key={group}>
      <h2 className="dt-settings-title">{t(`settingsGroup.${group}`)}</h2>
      {blocking && !onFix && <p className="dt-banner" role="status">
        <SetupMessage problem={blocking} lead />{' '}
        <button type="button" className="dt-textlink" onClick={() => navigate(setupPage(blocking.place))}>{t('setupFixLink')}</button>
      </p>}
      {content}
    </div>
  </div>
}
