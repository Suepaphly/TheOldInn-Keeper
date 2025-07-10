
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
    
    const monsterIndex = ptt.monsterArray.indexOf(monsterType);
    const cost = ptt.monsterCostArray[monsterIndex] * amount;
    const userMoney = await db.get(`money_${user.id}`) || 0;
    
    if (userMoney < cost) {
        return message.channel.send(`❌ You need ${cost} kopeks to summon ${amount} ${monsterType}(s)! You have ${userMoney} kopeks.`);
    }
    
    // Deduct cost and add monsters
    await db.sub(`money_${user.id}`, cost);
    
    const monsterHealth = ptt.monsterHealthArray[monsterIndex] * amount;
    const currentMonsters = await db.get("currentMonsters") || 0;
    await db.set("currentMonsters", currentMonsters + monsterHealth);
    
    // Check if battle should start (50+ total monster health)
    const totalMonsters = await db.get("currentMonsters");
    if (totalMonsters >= 50 && !await db.get("battleActive")) {
        await db.set("battleActive", true);
        message.channel.send(`👹 ${member} summons ${amount} ${monsterType}(s) for ${cost} kopeks!\n🚨 **BATTLE BEGINS!** The town is under attack with ${totalMonsters} total monster health! Use \`=attack\` to defend!`);
    } else {
        message.channel.send(`👹 ${member} summons ${amount} ${monsterType}(s) for ${cost} kopeks! Current threat level: ${totalMonsters} monster health.`);
    }
};

module.exports.help = {
    name: "summon",
    aliases: ["monster", "spawn", "call"]
};
