import type { Command } from '@/bot/commands/types'
import * as admin from './admin'
import * as create from './create'
import * as game from './game'
import * as photoshop from './photoshop'
import * as player from './player'
import * as leaderboard from './leaderboard'
import * as list from './list'
import * as panel from './panel'

export const commands: [string, Command][] = [
  [admin.data.name, admin],
  [create.data.name, create],
  [game.data.name, game],
  [photoshop.data.name, photoshop],
  [player.data.name, player],
  [leaderboard.data.name, leaderboard],
  [list.data.name, list],
  [panel.data.name, panel],
]
