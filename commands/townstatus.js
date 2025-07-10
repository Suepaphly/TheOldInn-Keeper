const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require('discord.js');
const ptt = require("../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    try {
        const user = message.author;

        // Get town defense data
        const townWalls = await db.get("townWalls") || 0;
        const townTroops = await db.get("townTroops") || {};
        const townTraps = await db.get("townTraps") || {};

        // Get current threats
        const currentMonsters = await db.get("currentMonsters") || 0;
        const battleActive = await db.get("battleActive") || false;

        // Calculate total troop count
        let totalTroops = 0;
        for (const [location, troops] of Object.entries(townTroops)) {
            for (const [troopType, count] of Object.entries(troops)) {
                totalTroops += count || 0;
            }
        }

        // Calculate total trap count
        let totalTraps = 0;
        for (const [location, traps] of Object.entries(townTraps)) {
            for (const [trapType, count] of Object.entries(traps)) {
                totalTraps += count || 0;
            }
        }

        const embed = new Discord.EmbedBuilder()
            .setTitle("🏰 TOWN STATUS REPORT")
            .setColor("#4169E1")
            .addFields(
                { name: "🧱 Total Walls", value: `${townWalls}`, inline: true },
                { name: "⚔️ Total Troops", value: `${totalTroops}`, inline: true },
                { name: "🕳️ Total Traps", value: `${totalTraps}`, inline: true },
                { name: "👹 Current Threat", value: battleActive ? `${currentMonsters} monsters attacking!` : "No active threats", inline: false },
                { name: "🛡️ Defense Slots", value: `${Math.floor(townWalls / 5)} available per player`, inline: true }
            )
            .setFooter({ text: "Use =map for detailed defense layout" });

        message.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        message.channel.send("❌ Error retrieving town status!");
    }
};

module.exports.help = {
    name: "townstatus",
    aliases: ["town", "status", "defenses"]
};