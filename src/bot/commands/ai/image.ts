import { SlashCommandBuilder, AttachmentBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { BROWSER_UA, CommandError, fetchBuffer, fetchJson, randInt } from '@/bot/utils/http'

export const scope = CommandScope.All
export const premium = true

export const data = new SlashCommandBuilder()
  .setName('image')
  .setDescription('Generate an AI Image')
  .addStringOption((opt) => opt.setName('prompt').setDescription('What to generate').setRequired(true))
  .addStringOption((opt) =>
    opt
      .setName('model')
      .setDescription('Image model')
      .setRequired(true)
      .addChoices(
        { name: 'Prodia', value: 'prodia' },
        { name: 'Pollinations', value: 'pollinations' },
        { name: 'Cartoon Character', value: 'cartoon' },
      ),
  )

const PRODIA_NEGATIVE =
  '(nsfw:1.5),verybadimagenegative_v1.3, ng_deepnegative_v1_75t, (ugly face:0.5),cross-eyed,sketches, (worst quality:2), (low quality:2.1), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, bad anatomy, DeepNegative, facing away, tilted head, {Multiple people}, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worstquality, low quality, normal quality, jpegartifacts, signature, watermark, username, blurry, bad feet, cropped, poorly drawn hands, poorly drawn face, mutation, deformed, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, extra fingers, fewer digits, extra limbs, extra arms,extra legs, malformed limbs, fused fingers, too many fingers, long neck, cross-eyed,mutated hands, polar lowres, bad body, bad proportions, gross proportions, text, error, missing fingers, missing arms, missing legs, extra digit, extra arms, extra leg, extra foot, repeating hair'

async function prodia(prompt: string): Promise<Buffer> {
  const headers = { 'user-agent': BROWSER_UA }
  const params = new URLSearchParams({
    new: 'true',
    prompt,
    model: 'dreamshaper_6BakedVae.safetensors [114c8abb]',
    negative_prompt: PRODIA_NEGATIVE,
    steps: '50',
    cfg: '9.5',
    seed: String(randInt(1, 10000)),
    sampler: 'Euler',
    aspect_ratio: 'square',
  })
  const { job } = await fetchJson<{ job: string }>(`https://api.prodia.com/generate?${params}`, {
    headers,
    signal: AbortSignal.timeout(30_000),
  })

  // Poll for up to ~60s instead of looping forever like the original.
  for (let attempt = 0; attempt < 30; attempt++) {
    const status = await fetchJson<{ status: string }>(`https://api.prodia.com/job/${job}`, { headers })
    if (status.status === 'succeeded') {
      return fetchBuffer(`https://images.prodia.xyz/${job}.png?download=1`, { headers })
    }
    if (status.status === 'failed') break
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new CommandError('Failed to generate image')
}

export async function execute(ctx: ChatInputCommandInteraction) {
  const prompt = ctx.options.getString('prompt', true)
  const model = ctx.options.getString('model', true)
  await ctx.reply('Generating please wait')

  if (model === 'cartoon') {
    const buf = await fetchBuffer(`https://robohash.org/${encodeURIComponent(prompt)}`)
    await ctx.followUp({
      content: `Your cartoon avatar:\n-# Prompt: ${prompt}`,
      files: [new AttachmentBuilder(buf, { name: 'cartoon_avatar.png' })],
    })
    return
  }

  const buf =
    model === 'prodia'
      ? await prodia(prompt)
      : await fetchBuffer(
          `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=700&height=700&seed=${randInt(1, 1_000_000)}&nologo=true`,
          { signal: AbortSignal.timeout(90_000) },
        )

  await ctx.followUp({
    content: `New Picture generated with ${model}`,
    files: [new AttachmentBuilder(buf, { name: 'image.png' })],
  })
}
