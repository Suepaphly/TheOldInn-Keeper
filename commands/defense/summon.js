const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require('discord.js');
const ptt = require("../../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    const user = message.author;
    const member = message.guild.members.cache.get(user.id);

    if (!args[0] || !args[1]) {
        let helpMessage = "👹 **MONSTER SUMMONING GUIDE** 👹\n\n";
        helpMessage += "**Usage:** `=summon [monster_type] [amount]`\n";
        helpMessage += "**Max amount per summon:** 20\n\n";
        helpMessage += "**Available Monsters:**\n";

        for (let i = 0; i < ptt.monsterArray.length; i++) {
            const monsterType = ptt.monsterArray[i];
            const cost = ptt.monsterCostArray[i];
            const health = ptt.monsterHealthArray[i];
            const damage = ptt.monsterDmgArray[i];

            helpMessage += `• **${monsterType.charAt(0).toUpperCase() + monsterType.slice(1)}** - ${cost} kopeks\n`;
            helpMessage += `  ❤️ Health: ${health} | ⚔️ Damage: ${damage}\n\n`;
        }

        helpMessage += "**Examples:**\n";
        helpMessage += "`=summon goblin 5` - Summon 5 goblins\n";
        helpMessage += "`=summon ogre 2` - Summon 2 ogres";

        return message.channel.send(helpMessage);
    }

    const monsterType = args[0].toLowerCase();
    const amount = parseInt(args[1]);

    if (!ptt.monsterArray.includes(monsterType)) {
        return message.channel.send("❌ Invalid monster type! Available: goblin, mephit, broodling, ogre, automaton");
    }

    if (isNaN(amount) || amount <= 0 || amount > 20) {
        return message.channel.send("❌ Amount must be a number between 1 and 20!");
    }

    // Check for black crystal discount and apply it
    const { hasCrystal } = require("../../utility/crystalUtils.js");
    const hasBlackCrystal = await hasCrystal(user.id, 'black');
    
    const monsterIndex = ptt.monsterArray.indexOf(monsterType);
    let cost = ptt.monsterCostArray[monsterIndex] * amount;
    
    if (hasBlackCrystal) {
        cost = Math.ceil(cost * 0.5); // 50% off, rounded up
    }

    // Check if player has enough money
    const playerMoney = await db.get(`money_${user.id}`) || 0;
    
    if (playerMoney < cost) {
        return message.channel.send(`❌ You need ${cost} kopeks to summon ${amount} ${monsterType}(s)!`);
    }

    // Deduct the discounted cost and add monsters
    await db.sub(`money_${user.id}`, cost);
    await ptt.addMonster(monsterType, amount);
    
    // Track monster summoner for reward distribution
    const currentContribution = await db.get(`monster_summoner_${user.id}`) || 0;
    await db.set(`monster_summoner_${user.id}`, currentContribution + cost);

    // Get total monster count for display
    const monsters = await db.get("Monsters") || {};
    const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);

    message.channel.send(`👹 ${member} summons ${amount} ${monsterType}(s)! Current monster army: ${totalMonsters} creatures.`);
};

module.exports.help = {
    name: "summon",
    aliases: ["monster", "spawn", "call"]
};