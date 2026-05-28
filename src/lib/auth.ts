import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { genericOAuth } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from './prisma'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: BASE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  account: {
    storeStateStrategy: 'cookie',
  },
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: false,
        input: false,
      },
      permissionLevel: {
        type: 'number',
        required: false,
        input: false,
        defaultValue: 0,
      },
    },
  },
  plugins: [
    nextCookies(),
    genericOAuth({
      config: [
        {
          providerId: 'tutla',
          clientId: process.env.TUTLA_CLIENT_ID!,
          clientSecret: process.env.TUTLA_CLIENT_SECRET!,
          authorizationUrl: 'https://account.tutla.net/api/oauth/authorize',
          tokenUrl: 'https://account.tutla.net/api/oauth/token',
          userInfoUrl: 'https://account.tutla.net/api/oauth/userinfo',
          scopes: ['all'],
          redirectURI: `${BASE_URL}/login/callback`,
          getUserInfo: async (tokens) => {
            const res = await fetch('https://account.tutla.net/api/oauth/userinfo', {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            })
            if (!res.ok) return null
            const user = await res.json()

            if ((user.permissionLevel || 0) < 80) return null

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.avatarUrl,
              emailVerified: user.emailVerified ?? false,
              username: user.username,
              permissionLevel: user.permissionLevel,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
          },
        },
      ],
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
export type User = Session['user'] & { username?: string; permissionLevel?: number }
