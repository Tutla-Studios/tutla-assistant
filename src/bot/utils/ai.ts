import { BROWSER_UA, CommandError } from './http'

/** Text generation via the same free proxy the Python bot used (Utils.ai / AICog.create). */
export async function ai(prompt: string): Promise<string> {
  let res: Response
  try {
    res = await fetch('https://api.binjie.fun/api/generateStream', {
      method: 'POST',
      headers: {
        origin: 'https://chat18.aichatos8.com/',
        'user-agent': BROWSER_UA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt + '\n respond in under 3500 characters',
        system: 'Always talk in English.',
        withoutContext: true,
        stream: false,
      }),
      signal: AbortSignal.timeout(60_000),
    })
  } catch {
    throw new CommandError('Unable to fetch the AI response.')
  }
  if (!res.ok) throw new CommandError('Unable to fetch the AI response.')
  return res.text()
}
