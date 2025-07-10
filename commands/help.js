
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
      { name: "🎲 Gambling", value: "Blackjack, craps, slots", inline: true },
      { name: "🏰 Defense", value: "Buy walls, troops, traps", inline: true },
      { name: "⚡ Combat", value: "Attack monsters in battle", inline: true },
      { name: "📊 Status", value: "Cooldowns, levels, skills", inline: true },
      { name: "💀 Dirty Deeds", value: "Rob players, summon monsters", inline: true }
    )
    .setFooter({ text: "The Tavernkeeper thanks you for playing! 🍺" });

  // How to Play embed
  const howToPlayEmbed = new EmbedBuilder()
    .setTitle("🎮 HOW TO PLAY - PROTECT THE TAVERN")
    .setColor("#FFD700")
    .setDescription("**Welcome to Protect the Tavern!** A cooperative defense game where players work together to defend their town from monster attacks.")
    .addFields(
      { 
        name: "🎯 Game Objective", 
        value: "Work with other players to build defenses and survive monster invasions. Monsters attack automatically and players must cooperate to defend the town!", 
        inline: false 
      },
      { 
        name: "🏰 Town Defenses", 
        value: "• **Walls**: rampart (100k), wall (500k), castle (5000k)\n• **Troops**: Hired defenders (dismissed after each battle)\n• **Traps**: Permanent defenses that fire when walls breach\n• Use `=buy` command to purchase defenses", 
        inline: false 
      },
      { 
        name: "⚔️ Battles & Combat", 
        value: "• Monsters spawn automatically and attack every few hours\n• Battles start when 50+ monsters gather\n• Players can `=attack` once per turn during battles\n• Defeating monsters grants kopek rewards based on combat skill\n• If defenses fail, monsters rob the town!", 
        inline: false 
      },
      { 
        name: "💰 Earning Kopeks", 
        value: "• **Activities**: gather, hunt, fish, craft, work (all have cooldowns)\n• **Gambling**: blackjack, craps, slots\n• **Combat**: Slay monsters for bounties\n• **Banking**: Keep kopeks safe from monster raids\n• Level up skills for better rewards!", 
        inline: false 
      },
      { 
        name: "📚 Need More Details?", 
        value: "Use the other help buttons to see specific commands for each category. Check `=map` for current threats and `=townstatus` for defense status!", 
        inline: false 
      }
    )
    .setFooter({ text: "Good luck, defender! The town is counting on you! 🛡️" });

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
      { name: "=startroulette", value: "Start roulette game", inline: true },
      { name: "=rbet [type] [amount]", value: "Place roulette bet", inline: true },
      { name: "=rhelp", value: "Roulette rules & bets", inline: true }
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
      { name: "=map", value: "View town status & threats", inline: true }
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

  // Dirty Deeds embed
  const dirtyDeedsEmbed = new EmbedBuilder()
    .setTitle("💀 DIRTY DEEDS - NEFARIOUS ACTIVITIES")
    .setColor("#8B0000")
    .setDescription("⚠️ **WARNING**: These commands allow you to attack your fellow townspeople and the town itself! Use at your own risk...")
    .addFields(
      { 
        name: "🏴‍☠️ Attacking Other Players", 
        value: "• **=rob [user]**: Rob up to 20% of another player's wallet (20% fail chance)\n• Higher thief levels increase success rate and steal amount\n• 10 hour cooldown between robberies", 
        inline: false 
      },
      { 
        name: "👹 Attacking the Town", 
        value: "• **=summon [type] [amount]**: Summon monsters to attack (costs kopeks)\n• **=startBattle**: Force immediate battle start (costs 1000 kopeks)\n• Monster types: goblin, mephit, broodling, ogre, automaton", 
        inline: false 
      },
      { 
        name: "💰 Town Raid Rewards", 
        value: "If monsters WIN the battle, participating attackers split 20-80% of ALL players' bank balances! Only the top 5 contributors are shown during battle messages.", 
        inline: false 
      },
      { 
        name: "⚖️ Consequences", 
        value: "• Failed robberies result in paying restitution to your victim\n• Failed town attacks waste your kopeks\n• The town guard doesn't look kindly on troublemakers...", 
        inline: false 
      }
    )
    .setFooter({ text: "Choose your side wisely, the tavern's fate hangs in the balance! ⚔️" });

  // Create buttons
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('home')
        .setLabel('🏠 Home')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('howtoplay')
        .setLabel('🎮 How to Play')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('economy')
        .setLabel('💰 Economy')
        .setStyle(ButtonStyle.Success)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('earning')
        .setLabel('⚔️ Earning')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('gambling')
        .setLabel('🎲 Gambling')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('defense')
        .setLabel('🏰 Defense')
        .setStyle(ButtonStyle.Primary)
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('combat')
        .setLabel('⚡ Combat')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('status')
        .setLabel('📊 Status')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('dirtydeeds')
        .setLabel('💀 Dirty Deeds')
        .setStyle(ButtonStyle.Danger)
    );

  // Send message with buttons (ephemeral - only visible to command user)
  const helpMessage = await message.reply({ 
    embeds: [mainEmbed], 
    components: [row1, row2, row3],
    ephemeral: false // Note: reply() to message makes it contextual to the user
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
      case 'howtoplay':
        embed = howToPlayEmbed;
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
      case 'dirtydeeds':
        embed = dirtyDeedsEmbed;
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
