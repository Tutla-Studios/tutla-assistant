import {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { ai } from '@/bot/utils/ai'
import { addCoins } from '@/bot/utils/economy'
import { clip, decodeHtml, fetchJson, pick } from '@/bot/utils/http'

export const scope = CommandScope.All

const moveOptions = (rows: number) => (s: import('discord.js').SlashCommandSubcommandBuilder) =>
  s
    .addIntegerOption((o) => o.setName('row').setDescription(`Row (1-${rows})`).setRequired(true).setMinValue(1).setMaxValue(rows))
    .addIntegerOption((o) => o.setName('col').setDescription(`Column (1-${rows})`).setRequired(true).setMinValue(1).setMaxValue(rows))

export const data = new SlashCommandBuilder()
  .setName('game')
  .setDescription('Play games')
  .addSubcommand((s) => moveOptions(3)(s.setName('tictactoe').setDescription('Play a game of tictactoe')))
  .addSubcommand((s) => moveOptions(10)(s.setName('connect4').setDescription('Play a game of connect4')))
  .addSubcommand((s) => s.setName('trivia').setDescription('Play a game of trivia'))
  .addSubcommand((s) =>
    s
      .setName('infiniterps')
      .setDescription('Infinite rock paper scissors')
      .addStringOption((o) => o.setName('object').setDescription('Your item').setRequired(true)),
  )
  .addSubcommand((s) =>
    s
      .setName('infinitecraft')
      .setDescription('InfiniteCraft in Discord!')
      .addStringOption((o) => o.setName('object_1').setDescription('First item').setRequired(true))
      .addStringOption((o) => o.setName('object_2').setDescription('Second item').setRequired(true)),
  )

// ── grid games ────────────────────────────────────────────────────────────────

type Mark = 'X' | 'O' | ' '

class GameBoard {
  board: Mark[][]
  winner: Mark | null = null

  constructor(readonly size: number, readonly winLength: number) {
    this.board = Array.from({ length: size }, () => Array<Mark>(size).fill(' '))
  }

  display(): string {
    return '```\n' + this.board.map((row) => row.join(' | ')).join('\n') + '\n```'
  }

  move(row: number, col: number, mark: Mark): boolean {
    if (this.board[row]?.[col] !== ' ') return false
    this.board[row][col] = mark
    if (this.isWin(row, col, mark)) this.winner = mark
    return true
  }

  botMove(): void {
    const free: [number, number][] = []
    this.board.forEach((r, ri) => r.forEach((c, ci) => c === ' ' && free.push([ri, ci])))
    if (free.length) this.move(...pick(free), 'O')
  }

  isDraw(): boolean {
    return this.board.every((r) => r.every((c) => c !== ' '))
  }

  private isWin(row: number, col: number, mark: Mark): boolean {
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]]
    return dirs.some(([dr, dc]) => {
      let count = 1
      for (const d of [1, -1]) {
        let r = row + d * dr
        let c = col + d * dc
        while (this.board[r]?.[c] === mark) {
          count++
          r += d * dr
          c += d * dc
        }
      }
      return count >= this.winLength
    })
  }
}

const games = { tictactoe: new Map<string, GameBoard>(), connect4: new Map<string, GameBoard>() }

async function playGrid(ctx: ChatInputCommandInteraction, kind: 'tictactoe' | 'connect4') {
  const store = games[kind]
  const userId = ctx.user.id
  const row = ctx.options.getInteger('row', true) - 1
  const col = ctx.options.getInteger('col', true) - 1

  let prefix = ''
  let game = store.get(userId)
  if (!game) {
    game = kind === 'tictactoe' ? new GameBoard(3, 3) : new GameBoard(10, 4)
    store.set(userId, game)
    prefix = `${kind} started! ${ctx.user} my bro is X.\n`
  }

  if (!game.move(row, col, 'X')) {
    await ctx.reply({ content: `Invalid move! Try again.\n${game.display()}`, ephemeral: true })
    return
  }
  if (game.winner) {
    store.delete(userId)
    await addCoins(userId, 100)
    await ctx.reply(`${prefix}X wins 100 Coins!\n${game.display()}`)
    return
  }
  if (game.isDraw()) {
    store.delete(userId)
    await ctx.reply(`${prefix}It's a draw!\n${game.display()}`)
    return
  }

  game.botMove()
  if (game.winner) {
    store.delete(userId)
    await ctx.reply(`${prefix}Bot (O) wins!\n${game.display()}`)
  } else if (game.isDraw()) {
    store.delete(userId)
    await ctx.reply(`${prefix}It's a draw!\n${game.display()}`)
  } else {
    await ctx.reply(`${prefix}Bot made a move.\n${game.display()}`)
  }
}

// ── trivia ────────────────────────────────────────────────────────────────────

async function trivia(ctx: ChatInputCommandInteraction) {
  const q = await fetchJson<any>('https://opentdb.com/api.php?amount=1')
  if (q.response_code !== 0) {
    await ctx.reply('Try again later')
    return
  }
  const r = q.results[0]
  const correct = decodeHtml(r.correct_answer)
  const answers = [...r.incorrect_answers.map(decodeHtml), correct].sort(() => Math.random() - 0.5) as string[]

  const embed = new EmbedBuilder()
    .setTitle('Trivia Time!')
    .setDescription(`**Question:** ${decodeHtml(r.question)}\n**Category:** ${decodeHtml(r.category)}`)
    .setColor(Colors.Blue)
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    answers.map((a, i) =>
      new ButtonBuilder().setCustomId(`trivia_${i}`).setLabel(a.slice(0, 80)).setStyle(ButtonStyle.Primary),
    ),
  )

  await ctx.reply({ embeds: [embed], components: [row] })
  const message = await ctx.fetchReply()
  const click = await message
    .awaitMessageComponent({ componentType: ComponentType.Button, filter: (i) => i.user.id === ctx.user.id, time: 15_000 })
    .catch(() => null)
  await ctx.editReply({ components: [] }).catch(() => null)

  if (!click) {
    await ctx.followUp('Time Up!')
    return
  }
  await click.deferUpdate()
  const chosen = answers[Number(click.customId.split('_')[1])]
  if (chosen === correct) {
    await addCoins(ctx.user.id, 100)
    await ctx.followUp('CORRECT & you got a 100 coins!')
  } else {
    await addCoins(ctx.user.id, -100)
    await ctx.followUp(`INCORRECT, Correct answer was \`${correct}\` & you lost a 100 coins`)
  }
}

// ── AI games ──────────────────────────────────────────────────────────────────

async function infiniteRps(ctx: ChatInputCommandInteraction) {
  const object = ctx.options.getString('object', true)
  await ctx.deferReply()
  const out = await ai(
    `Make the choice a 50/50 .Imagine your playing RPS but with ABSOULTETLY ANYTHING. Now you select a random item of the dictionary & make sure its a 50/50 on who wins as your play and then decide the winner. Format of respnse:\nYour Item: ${object}\nMy Item: [THE ITEM YOU SELECTED]\nReason: [explain how won] (DISPLAY **WINNER!** NEXT TO THE SLEETCED ITEMS & make winner 50/50)\n\nRESPOND ONLY WITH THE WINNER & YOUR ITEM AND MY ITEM IN THE ABOVE FORMAT. AND LASTLY A SENTENCE (reason) ON HOW THEY WON IN LESS THAN 15 WORDS. YOU CANNOT ASK FOR ANYTHING YOU CAN RESPOND WITH NOTHING OTHER THAN THE OUTPUT IN THAT FORMAT`,
  )
  await ctx.followUp(clip(out || 'No response.'))
}

async function infiniteCraft(ctx: ChatInputCommandInteraction) {
  const a = ctx.options.getString('object_1', true)
  const b = ctx.options.getString('object_2', true)
  await ctx.deferReply()
  const out = await ai(
    `Imagine your a crafting table, craft ${a} + ${b}. RESPOND ONLY WITH THE CRAFTED OUTPUT IN LESS THAN 3 WORDS NOTHING ELSE. YOU CANNOT ASK FOR ANYTHING JUST RESPOND WITH ONE POSSIBLE THING THAT COULD BE CRAFTED WITH THESE TWO OBJECTS. YOU CAN RESPOND WITH NOTHING OTHER THAN THE OUTPUT`,
  )
  await ctx.followUp(clip(`Your table (\`${a}\` + \`${b}\`): ${out}`))
}

export async function execute(ctx: ChatInputCommandInteraction) {
  switch (ctx.options.getSubcommand()) {
    case 'tictactoe':
      return playGrid(ctx, 'tictactoe')
    case 'connect4':
      return playGrid(ctx, 'connect4')
    case 'trivia':
      return trivia(ctx)
    case 'infiniterps':
      return infiniteRps(ctx)
    case 'infinitecraft':
      return infiniteCraft(ctx)
  }
}
