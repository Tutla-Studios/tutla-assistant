import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "discord.js",
    "@discordjs/ws",
    "@discordjs/rest",
    "@discordjs/core",
    "@discordjs/util",
    "@discordjs/builders",
    "@discordjs/collection",
    "bufferutil",
    "utf-8-validate",
    "zlib-sync",
  ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
