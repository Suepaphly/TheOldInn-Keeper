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

    // Use the protectTheTavern summonMonster function
    const success = await ptt.summonMonster(monsterType, amount, user.id);

    if (!success) {
        const monsterIndex = ptt.monsterArray.indexOf(monsterType);
        let cost = ptt.monsterCostArray[monsterIndex] * amount;

        // Check for black crystal discount
        const { hasCrystal } = require("../../utility/crystalUtils.js");
        const hasBlackCrystal = await hasCrystal(user.id, 'black');
        if (hasBlackCrystal) {
            cost = Math.ceil(cost * 0.5); // 50% off, rounded up
        }

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