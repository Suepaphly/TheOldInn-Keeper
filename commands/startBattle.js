
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
    
    message.channel.send(`⚔️ Battle commencing! ${totalMonsters} monsters are attacking the town!`);
    
    // Start the battle (this will run in background)
    ptt.startBattle().then(() => {
        message.channel.send("🏰 Battle has concluded! Check the console for results.");
    }).catch(error => {
        console.error("Battle error:", error);
        message.channel.send("❌ Battle encountered an error!");
    });
};

module.exports.help = {
    name: "startBattle",
    aliases: ["battle", "fight", "startbattle"]
};
