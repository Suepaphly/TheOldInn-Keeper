
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../utility/protectTheTavern.js");

exports.run = async (client, message, args) => {
    const user = message.author;
    const cost = 1000;
    
    // Check if user has enough kopeks
    const userMoney = await db.get(`money_${user.id}`) || 0;
    if (userMoney < cost) {
        return message.channel.send(`❌ You need ${cost} kopeks to force a battle! You only have ${userMoney} kopeks.`);
    }

    // Check if there are monsters to battle
    const monsters = await db.get("Monsters") || {};
    const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
    
    if (totalMonsters === 0) {
        return message.channel.send("No monsters available for battle! Use the summon command to add monsters first.");
    }

    // Deduct the cost
    await db.sub(`money_${user.id}`, cost);

    // Reset the automatic attack timer by scheduling the next attack immediately
    ptt.scheduleRandomAttack(0); // 0 milliseconds = immediate
    
    message.channel.send(`⚡ **${user.username} pays ${cost} kopeks to force an immediate battle!** The monster army of ${totalMonsters} creatures attacks now!`);
};

module.exports.help = {
    name: "startBattle",
    aliases: ["battle", "fight", "startbattle"]
};
