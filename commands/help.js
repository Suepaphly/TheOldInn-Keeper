
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
  // Main overview embed
  const mainEmbed = new EmbedBuilder()
    .setTitle("🏰 PROTECT THE TAVERN - COMMAND GUIDE 🏰")
    .setDescription("Click the buttons below to view different command categories!")
    .setColor("#FFD700")
    .addFields(
      { name: "💰 Economy", value: "Wallet, bank, pay, daily", inline: true },
      { name: "⚔️ Earning", value: "Gather, hunt, fish, craft, work", inline: true },
      { name: "🎲 Gambling", value: "Blackjack, craps, slots, rob", inline: true },
      { name: "🏰 Defense", value: "Buy walls, troops, traps", inline: true },
      { name: "⚡ Combat", value: "Attack monsters in battle", inline: true },
      { name: "📊 Status", value: "Cooldowns, levels, skills", inline: true }
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
      { name: "=lvl [skill]", value: "Level up skills", inline: true },
      { name: "=townstatus", value: "Check town defenses & threats", inline: true }
    );

  // Create buttons
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('home')
        .setLabel('🏠 Home')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('economy')
        .setLabel('💰 Economy')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('earning')
        .setLabel('⚔️ Earning')
        .setStyle(ButtonStyle.Success)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('gambling')
        .setLabel('🎲 Gambling')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('defense')
        .setLabel('🏰 Defense')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('combat')
        .setLabel('⚡ Combat')
        .setStyle(ButtonStyle.Danger)
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('status')
        .setLabel('📊 Status')
        .setStyle(ButtonStyle.Secondary)
    );

  // Send message with buttons
  const helpMessage = await message.channel.send({ 
    embeds: [mainEmbed], 
    components: [row1, row2, row3] 
  });

  // Create button collector
  const filter = (interaction) => interaction.user.id === message.author.id;
  const collector = helpMessage.createMessageComponentCollector({ filter, time: 300000 }); // 5 minutes

  collector.on('collect', async (interaction) => {
    let embed;
    switch (interaction.customId) {
      case 'home':
        embed = mainEmbed;
        break;
      case 'economy':
        embed = economyEmbed;
        break;
      case 'earning':
        embed = earningEmbed;
        break;
      case 'gambling':
        embed = gamblingEmbed;
        break;
      case 'defense':
        embed = defenseEmbed;
        break;
      case 'combat':
        embed = combatEmbed;
        break;
      case 'status':
        embed = statusEmbed;
        break;
      default:
        embed = mainEmbed;
    }

    await interaction.update({ embeds: [embed], components: [row1, row2, row3] });
  });

  collector.on('end', () => {
    // Disable all buttons when collector ends
    const disabledRows = [row1, row2, row3].map(row => {
      const newRow = new ActionRowBuilder();
      row.components.forEach(button => {
        newRow.addComponents(ButtonBuilder.from(button).setDisabled(true));
      });
      return newRow;
    });
    
    helpMessage.edit({ embeds: [mainEmbed], components: disabledRows }).catch(console.error);
  });
};

module.exports.help = {
  name: "help",
  aliases: ["commands", "command"]
}
