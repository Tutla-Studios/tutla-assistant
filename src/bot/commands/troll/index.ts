import type { Command } from '@/bot/commands/types'
import * as antinpc from './antinpc'
import * as fact from './fact'
import * as kanye from './kanye'
import * as catfact from './catfact'
import * as qotd from './qotd'
import * as joke from './joke'
import * as chatded from './chatded'
import * as advice from './advice'
import * as furry from './furry'
import * as showerthought from './showerthought'
import * as racisim from './racisim'
import * as gay from './gay'
import * as activesite from './activesite'
import * as doxx from './doxx'
import * as sex from './sex'
import * as match from './match'
import * as joshify from './joshify'
import * as l from './l'
import * as nuke from './nuke'
import * as rizz from './rizz'

export const commands: [string, Command][] = [
  [antinpc.data.name, antinpc],
  [fact.data.name, fact],
  [kanye.data.name, kanye],
  [catfact.data.name, catfact],
  [qotd.data.name, qotd],
  [joke.data.name, joke],
  [chatded.data.name, chatded],
  [advice.data.name, advice],
  [furry.data.name, furry],
  [showerthought.data.name, showerthought],
  [racisim.data.name, racisim],
  [gay.data.name, gay],
  [activesite.data.name, activesite],
  [doxx.data.name, doxx],
  [sex.data.name, sex],
  [match.data.name, match],
  [joshify.data.name, joshify],
  [l.data.name, l],
  [nuke.data.name, nuke],
  [rizz.data.name, rizz],
]
