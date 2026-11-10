-- AlterTable
ALTER TABLE "discord_user" ADD COLUMN     "adminLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tosAcceptedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "feed_subscription" (
    "channelId" TEXT NOT NULL,
    "guildId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_subscription_pkey" PRIMARY KEY ("channelId")
);

-- CreateTable
CREATE TABLE "bot_setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_setting_pkey" PRIMARY KEY ("key")
);
