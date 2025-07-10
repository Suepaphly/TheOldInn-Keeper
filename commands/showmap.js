const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require('discord.js');
const ptt = require("../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    try {
        // Get town data
        const townWalls = await db.get("townWalls") || 0;
        const townTroops = await db.get("townTroops") || {};
        const townTraps = await db.get("townTraps") || {};
        const currentMonsters = await db.get("currentMonsters") || 0;
        const battleActive = await db.get("battleActive") || false;

        // Create visual map
        let mapDisplay = "```\n";
        mapDisplay += "🏰 PROTECT THE TAVERN - TOWN MAP 🏰\n";
        mapDisplay += "=" * 40 + "\n\n";

        // Show wall status
        mapDisplay += `WALLS: ${townWalls} total\n`;
        if (townWalls >= 100) mapDisplay += "🏰🏰🏰 CASTLE WALLS 🏰🏰🏰\n";
        else if (townWalls >= 50) mapDisplay += "🧱🧱 STONE WALLS 🧱🧱\n";
        else if (townWalls >= 10) mapDisplay += "🪵 WOODEN RAMPARTS 🪵\n";
        else mapDisplay += "💀 DEFENSELESS 💀\n";

        mapDisplay += "\n";

        // Show defenses by location
        for (const wallType of ptt.wallArray) {
            if (townTroops[wallType] || townTraps[wallType]) {
                mapDisplay += `${wallType.toUpperCase()}:\n`;

                // Show troops
                if (townTroops[wallType]) {
                    for (const [troopType, count] of Object.entries(townTroops[wallType])) {
                        if (count > 0) {
                            mapDisplay += `  ⚔️ ${count}x ${troopType}\n`;
                        }
                    }
                }

                // Show traps
                if (townTraps[wallType]) {
                    for (const [trapType, count] of Object.entries(townTraps[wallType])) {
                        if (count > 0) {
                            mapDisplay += `  🕳️ ${count}x ${trapType}\n`;
                        }
                    }
                }
                mapDisplay += "\n";
            }
        }

        // Show current threats
        if (battleActive) {
            mapDisplay += "🚨 UNDER ATTACK! 🚨\n";
            mapDisplay += `👹 ${currentMonsters} monster health remaining\n`;
        } else if (currentMonsters > 0) {
            mapDisplay += `⚠️ Threats gathering: ${currentMonsters} monster health\n`;
        } else {
            mapDisplay += "✅ Town is safe\n";
        }

        mapDisplay += "```";

        message.channel.send(mapDisplay);

    } catch (error) {
        console.error(error);
        message.channel.send("❌ Error generating map. Please try again later.");
    }
};

module.exports.help = {
    name: "showmap",
    aliases: ["map", "layout", "view"]
};