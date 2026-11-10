import type { Command } from '@/bot/commands/types'
import * as bruh from './bruh'
import * as caption from './caption'
import * as color from './color'
import * as colorblind from './colorblind'
import * as bubble from './bubble'

export const commands: [string, Command][] = [
  [bruh.data.name, bruh],
  [caption.data.name, caption],
  [color.data.name, color],
  [colorblind.data.name, colorblind],
  [bubble.data.name, bubble],
]
