
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../utility/protectTheTavern.js");

exports.run = async (client, message, args) => {
    const ownerID = [
        "367445249376649217"
    ];

    // Check if user is authorized (you may want to adjust this)
    if (!ownerID.includes(message.author.id)) {
        return message.channel.send("❌ You don't have permission to use this command!");
    }

    // Check if there are monsters to battle
    const monsters = await db.get("Monsters") || {};
    const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
    
    if (totalMonsters === 0) {
        return message.channel.send("No monsters available for battle! Use the summon command to add monsters first.");
    }

    // Reset the automatic attack timer by scheduling the next attack immediately
    ptt.scheduleRandomAttack(0); // 0 milliseconds = immediate
    
    message.channel.send(`⚡ **BATTLE TIMER RESET!** The next automatic monster attack will trigger immediately with ${totalMonsters} monsters!`);
};

module.exports.help = {
    name: "startBattle",
    aliases: ["battle", "fight", "startbattle"]
};
