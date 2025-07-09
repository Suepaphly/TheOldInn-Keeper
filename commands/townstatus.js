
const { EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    try {
        // Get defense data
        const ramparts = await db.get("rampart") || 0;
        const walls = await db.get("wall") || 0;
        const castle = await db.get("castle") || 0;
        
        // Get troop data
        const rampartTroops = await db.get("Troops_rampart") || {};
        const wallTroops = await db.get("Troops_wall") || {};
        const castleTroops = await db.get("Troops_castle") || {};
        
        // Get trap data
        const rampartTraps = await db.get("Traps_rampart") || {};
        const wallTraps = await db.get("Traps_wall") || {};
        const castleTraps = await db.get("Traps_castle") || {};
        
        // Get monster data
        const monsters = await db.get("Monsters") || {};
        
        // Calculate total defenses
        let totalTroops = 0;
        let totalTraps = 0;
        
        for (const troopType of ptt.troopArray) {
            totalTroops += (rampartTroops[troopType] || 0) + (wallTroops[troopType] || 0) + (castleTroops[troopType] || 0);
        }
        
        for (const trapType of ptt.trapArray) {
            totalTraps += (rampartTraps[trapType] || 0) + (wallTraps[trapType] || 0) + (castleTraps[trapType] || 0);
        }
        
        // Calculate total monsters
        const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
        
        // Battle status
        const battleStatus = ptt.lockArena ? `🔴 **BATTLE IN PROGRESS** (Turn ${ptt.currentBattleTurn})` : "🟢 **PEACEFUL**";
        
        const embed = new EmbedBuilder()
            .setTitle("🏰 TOWN STATUS REPORT")
            .setColor(ptt.lockArena ? "#FF0000" : "#00FF00")
            .addFields(
                { name: "🛡️ **DEFENSES**", value: `Ramparts: ${ramparts}\nWalls: ${walls}\nCastle: ${castle}`, inline: true },
                { name: "⚔️ **FORCES**", value: `Total Troops: ${totalTroops}\nTotal Traps: ${totalTraps}`, inline: true },
                { name: "👹 **THREATS**", value: `Monsters: ${totalMonsters}`, inline: true },
                { name: "🏁 **STATUS**", value: battleStatus, inline: false }
            )
            .setFooter({ text: "Use =help for more commands" });
        
        // Add detailed breakdown if requested
        if (args[0] === "detailed" || args[0] === "detail") {
            let troopDetails = "";
            let trapDetails = "";
            let monsterDetails = "";
            
            // Troop breakdown
            for (const troopType of ptt.troopArray) {
                const total = (rampartTroops[troopType] || 0) + (wallTroops[troopType] || 0) + (castleTroops[troopType] || 0);
                if (total > 0) {
                    troopDetails += `${troopType}: ${total}\n`;
                }
            }
            
            // Trap breakdown
            for (const trapType of ptt.trapArray) {
                const total = (rampartTraps[trapType] || 0) + (wallTraps[trapType] || 0) + (castleTraps[trapType] || 0);
                if (total > 0) {
                    trapDetails += `${trapType}: ${total}\n`;
                }
            }
            
            // Monster breakdown
            for (const [monsterType, count] of Object.entries(monsters)) {
                if (count > 0) {
                    monsterDetails += `${monsterType}: ${count}\n`;
                }
            }
            
            if (troopDetails) embed.addFields({ name: "📊 **TROOP DETAILS**", value: troopDetails, inline: true });
            if (trapDetails) embed.addFields({ name: "📊 **TRAP DETAILS**", value: trapDetails, inline: true });
            if (monsterDetails) embed.addFields({ name: "📊 **MONSTER DETAILS**", value: monsterDetails, inline: true });
        } else {
            embed.addFields({ name: "💡 **TIP**", value: "Use `=townstatus detailed` for breakdown", inline: false });
        }
        
        message.channel.send({ embeds: [embed] });
        
    } catch (error) {
        console.error("Error in townstatus command:", error);
        message.channel.send("❌ Error retrieving town status!");
    }
};

module.exports.help = {
    name: "townstatus",
    aliases: ["town", "status", "defenses"]
};
