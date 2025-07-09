
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    try {
        const locations = ["rampart", "wall", "castle"];
        let mapInfo = "🏰 **TOWN DEFENSE STATUS** 🏰\n\n";

        // Show monster threat first
        const monsters = await db.get("Monsters") || {};
        const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
        
        if (totalMonsters > 0) {
            mapInfo += "👹 **MONSTER THREAT:** ";
            const monsterList = Object.entries(monsters)
                .filter(([type, count]) => count > 0)
                .map(([type, count]) => `${count} ${type}(s)`)
                .join(", ");
            mapInfo += `${monsterList} (Total: ${totalMonsters})\n\n`;
        } else {
            mapInfo += "👹 **MONSTER THREAT:** None - Town is safe!\n\n";
        }

        for (let location of locations) {
            // Get wall info
            const wallCount = (await db.get(location)) || 0;
            
            // Calculate available slots
            const availableSlots = Math.floor(wallCount / 10);

            // Get army info
            const armyData = (await db.get(`Troops_${location}`)) || {};
            let totalArmyCount = 0;
            let armyDetails = [];
            
            for (let armyType of ["town_guard", "mercenary", "soldier", "knight", "royal_guard"]) {
                const count = armyData[armyType] || 0;
                totalArmyCount += count;
                if (count > 0) {
                    armyDetails.push(`${armyType.replace('_', ' ')}: ${count}`);
                }
            }

            // Get trap info
            const trapData = (await db.get(`Traps_${location}`)) || {};
            let totalTrapCount = 0;
            let trapDetails = [];
            
            for (let trapType of ["spikes", "boiling_oil", "repeater", "ballista", "cannon"]) {
                const count = trapData[trapType] || 0;
                totalTrapCount += count;
                if (count > 0) {
                    trapDetails.push(`${trapType.replace('_', ' ')}: ${count}`);
                }
            }

            // Calculate remaining slots
            const usedSlots = totalArmyCount + totalTrapCount;
            const remainingSlots = Math.max(0, availableSlots - usedSlots);

            // Location emoji
            const locationEmoji = location === "rampart" ? "🛡️" : location === "wall" ? "🧱" : "🏰";

            // Append location info to mapInfo
            mapInfo += `${locationEmoji} **${location.toUpperCase()}** - HP: ${wallCount} | Capacity: ${availableSlots} slots\n`;
            
            if (armyDetails.length > 0) {
                mapInfo += `  ⚔️ Troops: ${armyDetails.join(", ")}\n`;
            } else {
                mapInfo += `  ⚔️ Troops: None\n`;
            }
            
            if (trapDetails.length > 0) {
                mapInfo += `  🪤 Traps: ${trapDetails.join(", ")}\n`;
            } else {
                mapInfo += `  🪤 Traps: None\n`;
            }
            
            mapInfo += `  📊 Slots Used: ${usedSlots}/${availableSlots} | Available: ${remainingSlots}\n\n`;
        }

        // Calculate total defense power
        let totalDefensePower = 0;
        for (const location of locations) {
            const troops = await db.get(`Troops_${location}`) || {};
            const traps = await db.get(`Traps_${location}`) || {};
            
            // Add up all defense damage
            for (const [troopType, count] of Object.entries(troops)) {
                if (troopType !== "total") {
                    const troopIndex = ["town_guard", "mercenary", "soldier", "knight", "royal_guard"].indexOf(troopType);
                    if (troopIndex !== -1) {
                        totalDefensePower += count * [1, 2, 5, 7, 9][troopIndex]; // troopDmgArray
                    }
                }
            }
            
            for (const [trapType, count] of Object.entries(traps)) {
                if (trapType !== "total") {
                    const trapIndex = ["spikes", "boiling_oil", "repeater", "ballista", "cannon"].indexOf(trapType);
                    if (trapIndex !== -1) {
                        totalDefensePower += count * [5, 10, 15, 25, 50][trapIndex]; // trapDmgArray
                    }
                }
            }
        }

        mapInfo += `💪 **Total Defense Power:** ${totalDefensePower} damage per turn`;

        message.channel.send(mapInfo);
    } catch (error) {
        console.error("Error fetching map data:", error);
        message.channel.send("There was an error displaying the map. Please try again later.");
    }
};

module.exports.help = {
    name: "showmap",
    aliases: ["map", "town", "status"],
};
