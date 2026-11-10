import type { Command } from '@/bot/commands/types'
import * as ai from './ai'
import * as image from './image'
import * as detectai from './detectai'

export const commands: [string, Command][] = [
  [ai.data.name, ai],
  [image.data.name, image],
  [detectai.data.name, detectai],
]
