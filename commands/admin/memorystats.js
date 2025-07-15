
const Discord = require("discord.js");
const memoryManager = require("../../utility/memoryManager.js");
const config = require("../../config.json");

module.exports.run = async (client, message, args) => {
    // Owner only
    if (message.author.id !== config.ownerID) {
        return message.channel.send("❌ This is an owner-only command!");
    }

    try {
        if (args[0] === 'cleanup') {
            const cleaned = await memoryManager.performCleanup();
            return message.channel.send(`🧹 Manual cleanup completed - removed ${cleaned} entries`);
        }

        if (args[0] === 'emergency') {
            const cleaned = await memoryManager.emergencyCleanup();
            return message.channel.send(`🚨 Emergency cleanup completed - removed ${cleaned} entries`);
        }

        const stats = await memoryManager.getMemoryStats();
        
        if (!stats) {
            return message.channel.send("❌ Failed to get memory statistics");
        }

        const embed = new Discord.EmbedBuilder()
            .setTitle("📊 Memory Usage Statistics")
            .setColor("#4169E1")
            .addFields(
                { name: "Total DB Entries", value: stats.totalEntries.toLocaleString(), inline: true },
                { name: "Active Quests (Memory)", value: stats.activeQuestsMemory.toString(), inline: true },
                { name: "Quest States (DB)", value: stats.questStates.toString(), inline: true },
                { name: "Combat States", value: stats.combatStates.toString(), inline: true },
                { name: "Cooldowns", value: stats.cooldowns.toString(), inline: true },
                { name: "Temp Data", value: stats.tempData.toString(), inline: true },
                { name: "Last Cleanup", value: stats.lastCleanup, inline: false }
            )
            .setFooter({ text: "Use 'memorystats cleanup' for manual cleanup or 'memorystats emergency' for full reset" });

        message.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error('Memory stats error:', error);
        message.channel.send("❌ An error occurred while getting memory statistics.");
    }
};

module.exports.help = {
    name: "memorystats",
    aliases: ["memstats", "memory"]
};
