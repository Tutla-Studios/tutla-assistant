import { SlashCommandBuilder, EmbedBuilder, Colors, type ChatInputCommandInteraction } from 'discord.js'
import { CommandScope } from '@/bot/commands/types'
import { rapidApi } from '@/bot/utils/http'

export const scope = CommandScope.All

export const data = new SlashCommandBuilder()
  .setName('instagram')
  .setDescription("Get an Instagram user's info")
  .addStringOption((o) => o.setName('username').setDescription('Instagram username').setRequired(true))

const val = (v: unknown) => (v === undefined || v === null || v === '' ? '-' : String(v).slice(0, 1024))

export async function execute(ctx: ChatInputCommandInteraction) {
  const username = ctx.options.getString('username', true)
  await ctx.reply({ content: 'Getting data...', ephemeral: true })

  const res = await rapidApi('https://instagram-scraper-api2.p.rapidapi.com/v1/info', 'instagram-scraper-api2.p.rapidapi.com', {
    params: { username_or_id_or_url: username },
  })
  const d = res.data
  if (!d) {
    await ctx.followUp(`Instagram user \`${username}\` not found.`)
    return
  }
  const about = d.about ?? {}

  const embed = new EmbedBuilder()
    .setTitle(username)
    .setDescription(d.biography || 'No Bio')
    .setColor(Colors.Purple)
    .addFields(
      { name: 'Full Name', value: val(d.full_name), inline: true },
      { name: 'Bio Links', value: val((d.bio_links ?? []).map((l: { url: string }) => l.url).join(', ')), inline: true },
      { name: 'Category', value: val(d.category), inline: true },
      { name: 'Linked', value: val(d.external_url), inline: true },
      { name: 'Followers', value: val(d.follower_count), inline: true },
      { name: 'Following', value: val(d.following_count), inline: true },
      { name: 'Country', value: val(about.country), inline: true },
      { name: 'Date Joined', value: val(about.date_joined), inline: true },
      { name: 'Former Usernames', value: val(about.former_usernames), inline: true },
      { name: 'Phone Number', value: val(d.contact_phone_number), inline: true },
      { name: 'Business Account', value: val(d.is_business), inline: true },
    )
  if (d.profile_pic_url) embed.setThumbnail(d.profile_pic_url)

  await ctx.followUp({ content: username, embeds: [embed] })
}
