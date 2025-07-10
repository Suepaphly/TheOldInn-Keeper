const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const ptt = require("../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    try {
        // Get town data using the correct structure from protectTheTavern.js
        const ramparts = (await db.get("rampart")) || 0;
        const walls = (await db.get("wall")) || 0;
        const castle = (await db.get("castle")) || 0;
        const monsters = (await db.get("Monsters")) || {};

        // Calculate total walls
        const totalWalls = ramparts + walls + castle;

        // Calculate total monster health
        let totalMonsterHealth = 0;
        for (let i = 0; i < ptt.monsterArray.length; i++) {
            const monsterType = ptt.monsterArray[i];
            const monsterCount = monsters[monsterType] || 0;
            totalMonsterHealth += monsterCount * ptt.monsterHealthArray[i];
        }

        // Also check the simplified currentMonsters key that summon.js is using
        const currentMonsters = (await db.get("currentMonsters")) || 0;
        if (currentMonsters > totalMonsterHealth) {
            totalMonsterHealth = currentMonsters;
        }

        // Create visual map
        let mapDisplay = "```\n";
        mapDisplay += "🏰 PROTECT THE TAVERN - TOWN MAP 🏰\n";
        mapDisplay += "========================================\n\n";

        // Show wall status
        mapDisplay += `DEFENSES:\n`;
        mapDisplay += `🛡️ Ramparts: ${ramparts}\n`;
        mapDisplay += `🧱 Walls: ${walls}\n`;
        mapDisplay += `🏰 Castle: ${castle}\n`;
        mapDisplay += `Total Defense: ${totalWalls}\n\n`;

        // Show defense status
        if (castle > 0) mapDisplay += "🏰🏰🏰 CASTLE STANDS STRONG 🏰🏰🏰\n";
        else if (walls > 0) mapDisplay += "🧱🧱 WALLS FORTIFIED 🧱🧱\n";
        else if (ramparts > 0) mapDisplay += "🪵 RAMPARTS HOLDING 🪵\n";
        else mapDisplay += "💀 DEFENSELESS 💀\n";

        mapDisplay += "\n";

        // Show troops and traps by location with player slot information
        for (const wallType of ptt.wallArray) {
            const wallCount = await db.get(wallType) || 0;
            const troops = (await db.get(`Troops_${wallType}`)) || {};
            const traps = (await db.get(`Traps_${wallType}`)) || {};

            // Calculate slots per player (1 slot per 5 walls)
            const slotsPerPlayer = Math.floor(wallCount / 5);

            let hasTroops = false;
            let hasTraps = false;
            let totalTroops = 0;
            let totalTraps = 0;

            // Check troops and count totals
            for (const troopType of ptt.troopArray) {
                const count = troops[troopType] || 0;
                if (count > 0) {
                    hasTroops = true;
                    totalTroops += count;
                }
            }

            // Check traps and count totals
            for (const trapType of ptt.trapArray) {
                const count = traps[trapType] || 0;
                if (count > 0) {
                    hasTraps = true;
                    totalTraps += count;
                }
            }

            // Always show location info if there are walls
            if (wallCount > 0) {
                mapDisplay += `${wallType.toUpperCase()} (${wallCount} units):\n`;
                mapDisplay += `  📊 Slots per player: ${slotsPerPlayer} troops, ${slotsPerPlayer} traps\n`;

                // Show troops
                if (hasTroops) {
                    mapDisplay += `  ⚔️ TROOPS (${totalTroops} total):\n`;
                    for (const troopType of ptt.troopArray) {
                        const count = troops[troopType] || 0;
                        if (count > 0) {
                            mapDisplay += `    • ${count}x ${troopType}\n`;
                        }
                    }
                } else if (slotsPerPlayer > 0) {
                    mapDisplay += `  ⚔️ TROOPS: None deployed\n`;
                }

                // Show traps
                if (hasTraps) {
                    mapDisplay += `  🕳️ TRAPS (${totalTraps} total):\n`;
                    for (const trapType of ptt.trapArray) {
                        const count = traps[trapType] || 0;
                        if (count > 0) {
                            mapDisplay += `    • ${count}x ${trapType}\n`;
                        }
                    }
                } else if (slotsPerPlayer > 0) {
                    mapDisplay += `  🕳️ TRAPS: None deployed\n`;
                }

                mapDisplay += "\n";
            }
        }

        // Show current threats
        if (ptt.lockArena) {
            mapDisplay += "🚨 UNDER ATTACK! 🚨\n";
            mapDisplay += `👹 ${totalMonsterHealth} monster health attacking\n`;
            mapDisplay += `Turn: ${ptt.currentBattleTurn}/10\n`;
        } else if (totalMonsterHealth > 0) {
            mapDisplay += `⚠️ Threats gathering: ${totalMonsterHealth} monster health\n`;
        } else {
            mapDisplay += "✅ Town is safe\n";
        }

        mapDisplay += "```";

        message.channel.send(mapDisplay);
    } catch (error) {
        console.error(error);
        message.channel.send(
            "❌ Error generating map. Please try again later.",
        );
    }
};

module.exports.help = {
    name: "showmap",
    aliases: ["map", "layout", "view"],
};