const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    try {
        const locations = ["rampart", "wall", "castle"];
        let mapInfo = "Map Overview:\n";

        for (let location of locations) {
            // Get wall info
            const wallCount = await db.get(location) || 0;

            // Calculate available slots
            const availableSlots = wallCount;

            // Get army info
            const armyData = await db.get(`Troops_${location}`) || {};
            const armyEntries = Object.entries(armyData).filter(entry => entry[0] !== "total");
            let totalArmyCount = 0;
            let armyInfo = "Armies: ";
            for (let armyType of ["town_guard", "mercenary", "soldier", "knight", "royal_guard"]) {
                const count = armyData[armyType] || 0;
                totalArmyCount += count;
                armyInfo += `${armyType.charAt(0).toUpperCase() + armyType.slice(1)}: ${count}, `;
            }
            armyInfo = armyInfo.slice(0, -2); // Remove trailing comma and space

            // Get trap info
            const trapData = await db.get(`Traps_${location}`) || {};
            const trapEntries = Object.entries(trapData).filter(entry => entry[0] !== "total");
            let totalTrapCount = 0;
            let trapInfo = "Traps: ";
            for (let trapType of ["spikes", "boiling_oil", "repeater", "ballista", "cannon"]) {
                const count = trapData[trapType] || 0;
                totalTrapCount += count;
                trapInfo += `${trapType.charAt(0).toUpperCase() + trapType.slice(1)}: ${count}, `;
            }
            trapInfo = trapInfo.slice(0, -2); // Remove trailing comma and space

            // Calculate remaining slots
            const usedSlots = totalArmyCount + totalTrapCount;
            const remainingSlots = availableSlots - usedSlots;

            // Append location info to mapInfo
            mapInfo += `\nLocation: ${location.charAt(0).toUpperCase() + location.slice(1)} | Size: ${wallCount}\n`;
            mapInfo += `${armyInfo}\n`;
            mapInfo += `${trapInfo}\n`;
            mapInfo += `Used Slots: ${usedSlots}/${availableSlots} | Remaining Slots: ${remainingSlots}\n`;
        }

        message.channel.send(mapInfo);
    } catch (error) {
        console.error('Error fetching map data:', error);
        message.channel.send('There was an error displaying the map. Please try again later.');
    }
}

module.exports.help = {
    name: "showmap",
    aliases: ["map"]
}
