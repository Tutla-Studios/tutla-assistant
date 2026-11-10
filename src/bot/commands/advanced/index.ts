import type { Command } from '@/bot/commands/types'
import * as admin from './admin'
import * as create from './create'
import * as game from './game'
import * as photoshop from './photoshop'
import * as player from './player'

export const commands: [string, Command][] = [
  [admin.data.name, admin],
  [create.data.name, create],
  [game.data.name, game],
  [photoshop.data.name, photoshop],
  [player.data.name, player],
]
