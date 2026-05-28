import type { Command } from '@/bot/commands/types'
import * as ansi from './ansi'
import * as afk from './afk'
export const commands: [string, Command][] = [
  [ansi.data.name, ansi],
  [afk.data.name, afk]
]