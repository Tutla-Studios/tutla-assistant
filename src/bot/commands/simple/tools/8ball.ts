import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { CommandScope } from '@/bot/commands/types'

export const scope = CommandScope.User

export const data = new SlashCommandBuilder()
  .setName('8ball')
  .setDescription('Ultimate Decision Maker')
  .addStringOption((opt) =>
    opt.setName('question').setDescription('Your question').setRequired(true),
  )

const RESPONSES = [
  'No 100%',
  'Yes bruh',
  'Roll **harder**',
  'wtf',
  'Obviously',
  'none of the above',
  'provide mroe context',
  'sounds like smth ur gramma would say',
  'no talk ez yas',
  'nah',
  'no dude',
  'yas :thumbsup:',
  ':thumbsdown:',
  '*yeets balls over face*',
  'prolly nah',
  "you forgot to press my *buttons*",
  "yes if there's e innit",
  "ain cool, so no",
  'if mexican yes',
  'kys ||keep yourself safe :thumbsup:||',
  'Yes definetly',
  'No ofc not you dumbahh',
  "that's gaytdom",
  'the one that supports gaytdom',
  'If taco man yes',
  'sounds like autism ',
  'option 1',
  'whatever your gut says',
  'all mine',
  'ain sigma',
  'ouf',
  '# 🇬🇦🇾🇹🇩🇴🇲',
  '[idc](https://media.discordapp.net/stickers/1193539237153357885.png?size=160&name=idc)',
  '[measf](https://media.discordapp.net/stickers/1201906160622637157.png?size=160&name=measf)',
  '[mate](https://media.discordapp.net/stickers/1256231390576381952.gif?size=160&name=mate)',
  '[notsupport](https://media.discordapp.net/stickers/1192829101547991220.png?size=160&name=notsupport)',
]

export async function execute(ctx: ChatInputCommandInteraction) {
  const question = ctx.options.getString('question', true)
  const response = question.endsWith('?')
    ? 'No 100%'
    : RESPONSES[Math.floor(Math.random() * RESPONSES.length)]
  await ctx.reply(`${response}\n-# Question: ${question}`)
}
