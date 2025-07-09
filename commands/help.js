
const Discord = require("discord.js");
const db = require("quick.db");

module.exports.run = async (client, message, args) => {

  message.channel.send(`
**🏰 PROTECT THE TAVERN - COMMAND GUIDE 🏰**

**💰 ECONOMY COMMANDS:**
=wallet - Check your balance
=bank [deposit amount] - Check your bank balance and deposit kopeks. Safe from monsters!
=withdraw [withdraw amount] - Withdraw kopeks from your bank
=pay [user] [amount] - Pay another user kopeks
=top - See the top wallets leaderboard
=daily - Receive your daily 100 kopeks

**⚔️ EARNING COMMANDS:**
=gather - Gather a random plant and sell it for kopeks
=hunt - Hunt a random animal and sell it for kopeks
=fish - Fish a random thing and sell it for kopeks
=craft - Craft a random item and sell it for kopeks
=work - Work a random job and make kopeks

**🎲 GAMBLING COMMANDS:**
=bj [bet amount] - Play blackjack
=craps [bet amount] - Play craps
=slots [bet amount] - Play slots
=rob [user] - Attempt to rob a user for up to 20% (20% fail chance)

**🏰 TOWN DEFENSE COMMANDS:**
=buy [amount] [location] [item] - Buy defenses for the town
  • Locations: rampart, wall, castle
  • Troops: town_guard, mercenary, soldier, knight, royal_guard
  • Traps: spikes, boiling_oil, repeater, ballista, cannon
  • Example: =buy 5 rampart town_guard

=map - View the town defense status and monster threats
=summon [monster type] [amount] - Summon monsters to attack the town
  • Monsters: goblin, mephit, broodling, ogre, automaton
=startBattle - Begin the monster attack (auto-starts at 50+ monsters)

**⚔️ COMBAT COMMANDS:**
=attack - Deal 10 damage to monsters during battle
=startNewGame - Reset the town defenses after defeat

**📊 STATUS COMMANDS:**
=cooldowns - Check all your cooldown timers
=checklvl - Check your skill levels
=lvl [skill] - Level up skills

**The Tavernkeeper thanks you for playing! 🍺**`);

}; 

module.exports.help = {
  name:"help",
  aliases: ["commands", "command"]
}
