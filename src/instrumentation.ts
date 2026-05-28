export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const [{ prisma }, { initBot }] = await Promise.all([
      import('./lib/prisma'),
      import('./bot'),
    ])
    await prisma.$connect()
    await initBot()
  }
}
