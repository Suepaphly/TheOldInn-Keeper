
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
  // Main overview embed
  const { EmbedBuilder } = Discord;
  const mainEmbed = new EmbedBuilder()
    .setTitle("🏰 PROTECT THE TAVERN - COMMAND GUIDE 🏰")
    .setDescription("Use the reactions below to navigate to different command categories!")
    .setColor("#FFD700")
    .addFields(
      { name: "💰", value: "Economy Commands", inline: true },
      { name: "⚔️", value: "Earning Commands", inline: true },
      { name: "🎲", value: "Gambling Commands", inline: true },
      { name: "🏰", value: "Defense Commands", inline: true },
      { name: "⚡", value: "Combat Commands", inline: true },
      { name: "📊", value: "Status Commands", inline: true }
    )
    .setFooter({ text: "The Tavernkeeper thanks you for playing! 🍺" });

  // Economy embed
  const economyEmbed = new EmbedBuilder()
    .setTitle("💰 ECONOMY COMMANDS")
    .setColor("#00FF00")
    .addFields(
      { name: "=wallet", value: "Check your balance", inline: false },
      { name: "=bank [amount]", value: "Check balance & deposit kopeks (safe from monsters!)", inline: false },
      { name: "=withdraw [amount]", value: "Withdraw kopeks from bank", inline: false },
      { name: "=pay [user] [amount]", value: "Pay another user kopeks", inline: false },
      { name: "=top", value: "See top wallets leaderboard", inline: false },
      { name: "=daily", value: "Receive daily 100 kopeks", inline: false }
    );

  // Earning embed
  const earningEmbed = new EmbedBuilder()
    .setTitle("⚔️ EARNING COMMANDS")
    .setColor("#32CD32")
    .addFields(
      { name: "=gather", value: "Gather plants for kopeks", inline: true },
      { name: "=hunt", value: "Hunt animals for kopeks", inline: true },
      { name: "=fish", value: "Fish for kopeks", inline: true },
      { name: "=craft", value: "Craft items for kopeks", inline: true },
      { name: "=work", value: "Work jobs for kopeks", inline: true }
    );

  // Gambling embed
  const gamblingEmbed = new EmbedBuilder()
    .setTitle("🎲 GAMBLING COMMANDS")
    .setColor("#FF6347")
    .addFields(
      { name: "=bj [bet]", value: "Play blackjack", inline: true },
      { name: "=craps [bet]", value: "Play craps", inline: true },
      { name: "=slots [bet]", value: "Play slots", inline: true },
      { name: "=rob [user]", value: "Rob up to 20% (20% fail chance)", inline: false }
    );

  // Defense embed
  const defenseEmbed = new EmbedBuilder()
    .setTitle("🏰 TOWN DEFENSE COMMANDS")
    .setColor("#4169E1")
    .addFields(
      { name: "Wall Types", value: "• rampart (100 kopeks)\n• wall (500 kopeks)\n• castle (5000 kopeks)", inline: true },
      { name: "Troops", value: "town_guard, mercenary, soldier, knight, royal_guard", inline: true },
      { name: "Traps", value: "spikes, boiling_oil, repeater, ballista, cannon", inline: true },
      { name: "=buy [amount] [type]", value: "Buy walls: `=buy 10 rampart`", inline: false },
      { name: "=buy [amount] [location] [item]", value: "Buy troops/traps: `=buy 5 rampart town_guard`", inline: false },
      { name: "Important", value: "Every 5 walls = 1 troop + 1 trap slot per player", inline: false },
      { name: "=map", value: "View town status & threats", inline: true },
      { name: "=summon [type] [amount]", value: "Summon monsters to attack", inline: true },
      { name: "=startBattle", value: "Begin attack (auto at 50+ monsters)", inline: true }
    );

  // Combat embed
  const combatEmbed = new EmbedBuilder()
    .setTitle("⚡ COMBAT COMMANDS")
    .setColor("#DC143C")
    .addFields(
      { name: "=attack", value: "Deal 10 damage to monsters during battle\n(Once per turn, 5 second intervals)", inline: false }
    );

  // Status embed
  const statusEmbed = new EmbedBuilder()
    .setTitle("📊 STATUS COMMANDS")
    .setColor("#9370DB")
    .addFields(
      { name: "=cooldowns", value: "Check all cooldown timers", inline: true },
      { name: "=checklvl", value: "Check your skill levels", inline: true },
      { name: "=lvl [skill]", value: "Level up skills", inline: true }
    );

  const embeds = [mainEmbed, economyEmbed, earningEmbed, gamblingEmbed, defenseEmbed, combatEmbed, statusEmbed];
  const emojis = ["🏠", "💰", "⚔️", "🎲", "🏰", "⚡", "📊"];

  // Send main embed with reactions
  const helpMessage = await message.channel.send({ embeds: [mainEmbed] });

  // Add reaction emojis
  for (const emoji of emojis) {
    await helpMessage.react(emoji);
  }

  // Create reaction collector
  const filter = (reaction, user) => {
    return emojis.includes(reaction.emoji.name) && user.id === message.author.id;
  };

  const collector = helpMessage.createReactionCollector({ filter, time: 60000 });

  collector.on('collect', (reaction) => {
    const emojiIndex = emojis.indexOf(reaction.emoji.name);
    if (emojiIndex !== -1) {
      helpMessage.edit({ embeds: [embeds[emojiIndex]] });
    }
    
    // Remove user's reaction but keep the bot's
    reaction.users.remove(message.author.id);
  });

  collector.on('end', () => {
    helpMessage.edit({ embeds: [mainEmbed] });
    helpMessage.reactions.removeAll().catch(console.error);
  });
};

module.exports.help = {
  name: "help",
  aliases: ["commands", "command"]
}
