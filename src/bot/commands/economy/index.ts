import type { Command } from '@/bot/commands/types'
import * as coins from './coins'
import * as daily from './daily'
import * as pay from './pay'
import * as rob from './rob'
import * as xp from './xp'

export const commands: [string, Command][] = [
  [coins.data.name, coins],
  [daily.data.name, daily],
  [pay.data.name, pay],
  [rob.data.name, rob],
  [xp.data.name, xp],
]
