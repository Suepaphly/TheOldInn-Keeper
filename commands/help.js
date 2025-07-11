
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
  // Main overview embed - Quick Start Guide
  const mainEmbed = new EmbedBuilder()
    .setTitle("🏰 PROTECT THE TAVERN - QUICK START GUIDE 🏰")
    .setDescription("**Welcome, Defender!** Get started protecting the tavern with these essential commands:")
    .setColor("#FFD700")
    .addFields(
      { 
        name: "💰 Start Earning", 
        value: "`=daily` - Get 100 kopeks\n`=gather` - Earn money gathering\n`=wallet` - Check your balance", 
        inline: true 
      },
      { 
        name: "🏰 Build Defenses", 
        value: "`=buy 10 rampart` - Buy walls\n`=buy 5 rampart town_guard` - Buy troops\n`=map` - Check town status", 
        inline: true 
      },
      { 
        name: "⚔️ Join Battle", 
        value: "`=attack` - Fight monsters\n`=shop` - Buy weapons/armor\n`=backpack` - Check inventory (5 item limit)", 
        inline: true 
      },
      { 
        name: "💰 Economy", 
        value: "Wallet, bank, pay, daily", 
        inline: true 
      },
      { 
        name: "⚔️ Earning", 
        value: "Gather, hunt, fish, craft, work", 
        inline: true 
      },
      { 
        name: "🎲 Gambling", 
        value: "Blackjack, craps, slots, poker", 
        inline: true 
      },
      { 
        name: "🏰 Defense", 
        value: "Buy walls, troops, traps", 
        inline: true 
      },
      { 
        name: "⚡ Combat", 
        value: "Attack monsters in battle", 
        inline: true 
      },
      { 
        name: "📊 Status", 
        value: "Cooldowns, levels, skills", 
        inline: true 
      },
      { 
        name: "💀 Dirty Deeds", 
        value: "Rob players, summon monsters", 
        inline: true 
      }
    )
    .setFooter({ text: "Click buttons below for detailed commands | The Tavernkeeper thanks you! 🍺" });

  // How to Play embed - Game Mechanics
  const howToPlayEmbed = new EmbedBuilder()
    .setTitle("🎮 HOW TO PLAY - PROTECT THE TAVERN")
    .setColor("#FFD700")
    .setDescription("**A cooperative defense game** where players work together to defend their town from monster invasions.")
    .addFields(
      { 
        name: "🎯 Game Objective", 
        value: "Monsters attack automatically every few hours. Players must cooperate to build defenses and survive the invasions. If defenses fail, monsters rob the town's banks!", 
        inline: false 
      },
      { 
        name: "🏰 The Castle & Defenses", 
        value: "• **Walls**: rampart (100k), wall (500k), castle (5000k) - Your first line of defense\n• **Troops**: town_guard, mercenary, soldier, knight, royal_guard - Fight monsters\n• **Traps**: spikes, boiling_oil, repeater, ballista, cannon - Permanent defenses\n• **Rule**: Every 5 walls = 1 troop slot + 1 trap slot per player\n• Use `=buy [amount] [type]` for walls, `=buy [amount] [location] [item]` for troops/traps", 
        inline: false 
      },
      { 
        name: "🏦 Banking System", 
        value: "• **Banks are SAFE** - Monsters cannot steal banked kopeks during raids\n• Use `=bank [amount]` to deposit kopeks for safety\n• Use `=withdraw [amount]` to take kopeks out\n• Only wallet kopeks are at risk during monster victories!", 
        inline: false 
      },
      { 
        name: "⚔️ Battle System", 
        value: "• Monsters spawn automatically (goblins every 6h, mephits every 12h, etc.)\n• Battle starts when 50+ monsters gather\n• Players can `=attack` once per turn (5 second intervals)\n• Combat skill affects damage dealt to monsters\n• Defeating monsters grants kopek bounties", 
        inline: false 
      },
      { 
        name: "💰 Economy & Skills", 
        value: "• **Earning**: gather, hunt, fish, craft, work (all have cooldowns)\n• **Gambling**: blackjack, craps, slots, poker, roulette\n• **Skills**: Level up with `=lvl [skill]` to improve rewards\n• **Trading**: Send items with `=send @user [item]`, sell with `=shop sell [item]`\n• **PvP**: Rob other players or fight them directly", 
        inline: false 
      },
      { 
        name: "🛡️ Survival Tips", 
        value: "• Bank your kopeks regularly for safety\n• Buy defenses early and often\n• Level up skills for better earning potential\n• Participate in battles to earn bounties\n• Manage your 5-item backpack limit with `=shop sell [item]`\n• Check `=map` and `=townstatus` regularly", 
        inline: false 
      }
    )
    .setFooter({ text: "The town's survival depends on cooperation! Work together! 🛡️" });

  // Economy embed
  const economyEmbed = new EmbedBuilder()
    .setTitle("💰 ECONOMY COMMANDS")
    .setColor("#00FF00")
    .addFields(
      { name: "=wallet", value: "Check your kopek balance", inline: true },
      { name: "=balance", value: "Check your kopek balance (alias)", inline: true },
      { name: "=bank [amount]", value: "Check balance & deposit kopeks (SAFE from monsters!)", inline: false },
      { name: "=withdraw [amount]", value: "Withdraw kopeks from bank to wallet", inline: true },
      { name: "=pay [user] [amount]", value: "Pay another user kopeks from wallet", inline: true },
      { name: "=send @user [item]", value: "Send weapons/armor to another player", inline: true },
      { name: "=shop sell [item]", value: "Sell items for 50% of purchase price", inline: true },
      { name: "=top", value: "See top wallets leaderboard", inline: true },
      { name: "=daily", value: "Receive daily 100 kopeks", inline: true },
      { name: "=beg", value: "Beg for kopeks (small chance)", inline: true },
      { name: "=stimmy", value: "Government stimulus (admin only)", inline: true }
    );

  // Earning embed
  const earningEmbed = new EmbedBuilder()
    .setTitle("⚔️ EARNING COMMANDS")
    .setColor("#32CD32")
    .addFields(
      { name: "=gather", value: "Gather plants for kopeks (skill-based)", inline: true },
      { name: "=hunt", value: "Hunt animals for kopeks (skill-based)", inline: true },
      { name: "=fish", value: "Fish for kopeks (skill-based)", inline: true },
      { name: "=craft", value: "Craft items for kopeks (skill-based)", inline: true },
      { name: "=work", value: "Work jobs for kopeks (skill-based)", inline: true },
      { name: "=cooldown", value: "Check all activity cooldown timers", inline: true },
      { name: "=checklvl", value: "Check your skill levels", inline: true },
      { name: "=lvl [skill]", value: "Level up skills for better rewards", inline: true }
    )
    .setFooter({ text: "Higher skill levels = better rewards and shorter cooldowns!" });

  // Gambling embed
  const gamblingEmbed = new EmbedBuilder()
    .setTitle("🎲 GAMBLING COMMANDS")
    .setColor("#FF6347")
    .addFields(
      { name: "=bj [bet]", value: "Play blackjack (21)", inline: true },
      { name: "=craps [bet]", value: "Play craps dice game", inline: true },
      { name: "=slots [bet]", value: "Play slot machine", inline: true },
      { name: "=poker [bet]", value: "Play 5-card draw poker (Aces Wild)", inline: true },
      { name: "=startroulette", value: "Start roulette game", inline: true },
      { name: "=rbet [type] [amount]", value: "Place roulette bet", inline: true },
      { name: "=rhelp", value: "Roulette rules & betting options", inline: true },
      { name: "=rlast", value: "Check last roulette result", inline: true }
    )
    .setFooter({ text: "Gamble responsibly! The house usually wins..." });

  // Defense embed
  const defenseEmbed = new EmbedBuilder()
    .setTitle("🏰 TOWN DEFENSE COMMANDS")
    .setColor("#4169E1")
    .addFields(
      { name: "Wall Types & Costs", value: "• **rampart** - 100 kopeks\n• **wall** - 500 kopeks\n• **castle** - 5000 kopeks", inline: true },
      { name: "Troop Types", value: "• **town_guard** - Basic defender\n• **mercenary** - Hired fighter\n• **soldier** - Trained warrior\n• **knight** - Elite defender\n• **royal_guard** - Ultimate protection", inline: true },
      { name: "Trap Types", value: "• **spikes** - Basic damage\n• **boiling_oil** - Area damage\n• **repeater** - Multiple shots\n• **ballista** - Heavy damage\n• **cannon** - Massive damage", inline: true },
      { name: "=buy [amount] [type]", value: "Buy walls: `=buy 10 rampart`", inline: false },
      { name: "=buy [amount] [location] [item]", value: "Buy troops/traps: `=buy 5 rampart town_guard`", inline: false },
      { name: "Defense Rules", value: "• Every 5 walls = 1 troop slot + 1 trap slot per player\n• Troops are dismissed after each battle\n• Traps are permanent until destroyed", inline: false },
      { name: "=map", value: "View town status, defenses & monster threats", inline: true }
    );

  // Combat embed
  const combatEmbed = new EmbedBuilder()
    .setTitle("⚡ COMBAT COMMANDS")
    .setColor("#DC143C")
    .addFields(
      { name: "=attack", value: "Deal damage to monsters during battle (once per turn, 5 sec intervals)", inline: false },
      { name: "=shop", value: "Browse and buy weapons, armor, and combat items", inline: true },
      { name: "=shop sell [item]", value: "Sell items for 50% of their original value", inline: true },
      { name: "=backpack", value: "View your inventory and equipped items (5 item limit)", inline: true },
      { name: "=send @user [item]", value: "Send weapons or armor to another player", inline: true },
      { name: "=attackplayer [user]", value: "Challenge another player to PvP combat", inline: true },
      { name: "=violate [user]", value: "Humiliate another player (4 rounds, attacker takes no damage)", inline: true },
      { name: "=revive [user]", value: "Revive a dead player for 1000 kopeks", inline: true },
      { name: "Backpack Rules", value: "• Maximum 5 items per player\n• Use `=shop sell [item]` to make space\n• Cannot receive items if backpack is full", inline: false },
      { name: "Combat Info", value: "• Health: 5 base + 2 per combat level\n• Weapons: knife (1-3), sword (2-4), pistol (3-5) + combat level bonus\n• Dead players cannot act for 24 hours", inline: false }
    );

  // Status embed
  const statusEmbed = new EmbedBuilder()
    .setTitle("📊 STATUS & INFO COMMANDS")
    .setColor("#9370DB")
    .addFields(
      { name: "=cooldown", value: "Check all activity cooldown timers", inline: true },
      { name: "=checklvl", value: "Check your skill levels", inline: true },
      { name: "=lvl [skill]", value: "Level up skills with kopeks", inline: true },
      { name: "=map", value: "View town map with monster locations", inline: true },
      { name: "=leaderboard", value: "View top players by wealth", inline: true },
      { name: "Admin Commands", value: "=addmoney, =removemoney, =removestuff, =resetcooldown, =startNewGame", inline: false }
    );

  // Dirty Deeds embed
  const dirtyDeedsEmbed = new EmbedBuilder()
    .setTitle("💀 DIRTY DEEDS - NEFARIOUS ACTIVITIES")
    .setColor("#8B0000")
    .setDescription("⚠️ **WARNING**: These commands allow you to attack your fellow townspeople and the town itself!")
    .addFields(
      { 
        name: "🏴‍☠️ Robbing Other Players", 
        value: "• **=rob [user]**: Rob up to 20% of another player's wallet (20% fail chance)\n• Higher thief levels increase success rate and steal amount\n• 10 hour cooldown between robberies\n• Failed robberies result in paying restitution to victim", 
        inline: false 
      },
      { 
        name: "⚔️ Player vs Player Combat", 
        value: "• **=attackplayer [user]**: Challenge another player to combat\n• **=violate [user]**: Humiliate another player (4 rounds, no damage to attacker)\n• **=revive [user]**: Revive a dead player for 1000 kopeks\n• Combat uses health: 5 base + 2 per combat level\n• Losers are dead for 24 hours unless revived", 
        inline: false 
      },
      { 
        name: "👹 Attacking the Town", 
        value: "• **=summon [type] [amount]**: Summon monsters to attack (costs kopeks)\n• **=startBattle**: Force immediate battle start (costs 1000 kopeks)\n• Monster types: goblin, mephit, broodling, ogre, automaton\n• Each type has different costs, health, and damage", 
        inline: false 
      },
      { 
        name: "💰 Monster Victory Rewards", 
        value: "If monsters WIN the battle, participating attackers split 20-80% of ALL players' bank balances! Only the top 5 contributors are shown during battle messages.", 
        inline: false 
      },
      { 
        name: "⚖️ Consequences & Risks", 
        value: "• Failed robberies cost you money in restitution\n• Failed town attacks waste your kopeks\n• PvP combat losers are dead for 24 hours\n• The town guard doesn't look kindly on troublemakers...", 
        inline: false 
      }
    )
    .setFooter({ text: "Choose your side wisely - defender or destroyer? ⚔️" });

  // Create buttons
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('home')
        .setLabel('🏠 Quick Start')
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

  // Send message with buttons
  const helpMessage = await message.reply({ 
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
