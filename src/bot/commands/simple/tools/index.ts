import type { Command } from '@/bot/commands/types'
import * as ansi from './ansi'

export const commands: [string, Command][] = [
  [ansi.data.name, ansi],
]
