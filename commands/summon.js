
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require('discord.js');
const ptt = require("../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    const user = message.author;
    const member = message.guild.members.cache.get(user.id);
    
    if (!args[0] || !args[1]) {
        return message.channel.send("❌ Usage: `=summon [monster_type] [amount]`\nMonster types: goblin, mephit, broodling, ogre, automaton");
    }
    
    const monsterType = args[0].toLowerCase();
    const amount = parseInt(args[1]);
    
    if (!ptt.monsterArray.includes(monsterType)) {
        return message.channel.send("❌ Invalid monster type! Available: goblin, mephit, broodling, ogre, automaton");
    }
    
    if (isNaN(amount) || amount <= 0 || amount > 20) {
        return message.channel.send("❌ Amount must be a number between 1 and 20!");
    }
    
    // Use the protectTheTavern summonMonster function
    const success = await ptt.summonMonster(monsterType, amount, user.id);
    
    if (!success) {
        const monsterIndex = ptt.monsterArray.indexOf(monsterType);
        const cost = ptt.monsterCostArray[monsterIndex] * amount;
        return message.channel.send(`❌ You need ${cost} kopeks to summon ${amount} ${monsterType}(s)!`);
    }
    
    // Get total monster count for display
    const monsters = await db.get("Monsters") || {};
    const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
    
    message.channel.send(`👹 ${member} summons ${amount} ${monsterType}(s)! Current monster army: ${totalMonsters} creatures.`);
};

module.exports.help = {
    name: "summon",
    aliases: ["monster", "spawn", "call"]
};
