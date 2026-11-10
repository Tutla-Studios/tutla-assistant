import { pick } from '@/bot/utils/http'
import { SUFFIXES } from './data'

/** FLAMES: strike out shared letters, then count around the word until one result remains. */
export function flames(a: string, b: string): string {
  const p1 = [...a]
  const p2 = [...b]
  for (;;) {
    const i = p1.findIndex((c) => p2.includes(c))
    if (i === -1) break
    const j = p2.indexOf(p1[i])
    p1.splice(i, 1)
    p2.splice(j, 1)
  }

  const count = p1.length + p2.length
  let result = ['Friends', 'Love', 'Affection', 'Marriage', 'Enemy', 'Siblings']
  while (result.length > 1) {
    const split = (count % result.length) - 1
    result = split >= 0 ? [...result.slice(split + 1), ...result.slice(0, split)] : result.slice(0, -1)
  }
  return result[0]
}

const STRIP_SUFFIXES = ['ly', 'er', 'es', 'ant', 'ance', 'ary', 'tion', 'ation', 'ed', 'ing', 'dom', 'er', 'ful', 'ous', 'ship', 'wards', 'al', 'ate', 'acy']

function transformWord(word: string): string {
  const lower = word.toLowerCase()
  if (word.endsWith('ed')) return word.slice(0, -2) + 'ing'
  if (word.endsWith('ing')) return word.slice(0, -3) + 'ed'
  if (word.endsWith('s')) return Math.random() > 0.7 ? word.slice(0, -1) : word + pick(SUFFIXES)
  if (['the', 'an', 'is', 'and'].includes(lower)) return 'a'
  if (word.endsWith('ly')) return word.slice(0, -2) + pick(SUFFIXES)
  if (['at', 'on', 'that', 'these', 'those'].includes(lower)) return 'in'
  if (['you', 'who', 'whom', 'me'].includes(lower)) return 'your'
  if (['i', 'us'].includes(lower)) return 'me'
  if (['he', 'she', 'it', 'her', 'him', "it's", 'his'].includes(lower)) return 'its'
  if (['didnt', 'no', 'not', 'aint'].includes(lower.replaceAll("'", ''))) return "didn't"
  if (word.includes(',')) return word.replaceAll(',', '.')
  if (['in', 'a'].includes(lower)) return 'it'
  if (['will', 'do', 'make', 'want', 'to'].includes(lower)) return 'shall'
  if (['your', 'youre', 'yours'].includes(lower.replaceAll("'", ''))) return 'you'
  if (word.length > 4 && SUFFIXES.some((s) => lower.endsWith(s))) {
    let out = word
    for (const s of STRIP_SUFFIXES) {
      if (out.toLowerCase().endsWith(s)) out = out.slice(0, -s.length) + pick(SUFFIXES)
    }
    return out
  }
  if (Math.random() > 0.9 && word.length > 3) return [...word].filter((c) => !'iou'.includes(c.toLowerCase())).join('')
  if (Math.random() < 0.1) return word + pick([',', '.', ' a', '!'])
  return word
}

/** "Ruin grammar" — port of the Python joshify command. */
export function joshify(input: string): string {
  return input.split(' ').map(transformWord).join(' ')
}
