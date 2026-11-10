import type { Command } from '@/bot/commands/types'
import * as changelog from './changelog'
import * as dm from './dm'
import * as premium from './premium'
import * as reload from './reload'
import * as report from './report'
import * as bugs from './bugs'
import * as say from './say'
import * as subscribe from './subscribe'
import * as version from './version'

export const commands: [string, Command][] = [
  [changelog.data.name, changelog],
  [dm.data.name, dm],
  [premium.data.name, premium],
  [reload.data.name, reload],
  [report.data.name, report],
  [bugs.data.name, bugs],
  [say.data.name, say],
  [subscribe.data.name, subscribe],
  [version.data.name, version],
]
