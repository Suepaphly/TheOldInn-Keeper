
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../utility/protectTheTavern.js");

exports.run = async (client, message, args) => {
    const ownerID = [
        "367445249376649217"
    ];
    
    if (!ownerID.includes(message.author.id)) {
        return message.channel.send("Only the tavernkeeper can start battles!");
    }
    
    if (ptt.lockArena) {
        return message.channel.send("A battle is already in progress!");
    }
    
    // Check if there are monsters to fight
    const monsters = await db.get("Monsters") || {};
    const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
    
    if (totalMonsters === 0) {
        return message.channel.send("No monsters to battle! Use the summon command to add monsters first.");
    }
    
    message.channel.send(`⚔️ **IMMEDIATE BATTLE TRIGGERED!** ${totalMonsters} monsters are attacking the town!`);
    
    // Reschedule the next random attack
    ptt.scheduleRandomAttack();
    
    // Start the battle (this will run in background)
    ptt.startBattle(message.channel).then(() => {
        message.channel.send("🏰 Battle has concluded! Next automatic attack has been rescheduled.");
    }).catch(error => {
        console.error("Battle error:", error);
        message.channel.send("❌ Battle encountered an error!");
    });
};

module.exports.help = {
    name: "startBattle",
    aliases: ["battle", "fight", "startbattle"]
};
