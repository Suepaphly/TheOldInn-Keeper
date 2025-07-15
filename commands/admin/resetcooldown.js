const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("../../config.json");
const config = require("./config.json");

module.exports.run = async (client, message, args) => {
    const ownerID = config.ownerID;

    if (!ownerID.includes(message.author.id)) {
        return message.channel.send(
            "You do not have permission to use this command.",
        );
    }

    try {
        // Get all data from the database
        const allData = await db.all();

        // Filter for cooldown-related keys
        const cooldownKeys = allData.filter((item) => {
            return (
                item.id.includes("daily_") ||
                item.id.includes("fish_") ||
                item.id.includes("craft_") ||
                item.id.includes("gather_") ||
                item.id.includes("hunt_") ||
                item.id.includes("work_") ||
                item.id.includes("rob_") ||
                item.id.includes("deposit_") ||
                item.id.includes("snoop_cooldown_") ||
                item.id.includes("steal_cooldown_")
            );
        });

        // Delete all cooldown entries
        for (const entry of cooldownKeys) {
            await db.delete(entry.id);
        }

        message.channel.send(
            `🔄 **Cooldowns Reset!** Successfully reset ${cooldownKeys.length} cooldown entries for all players.`,
        );
    } catch (error) {
        console.error("Error resetting cooldowns:", error);
        message.channel.send("❌ An error occurred while resetting cooldowns.");
    }
};

module.exports.help = {
    name: "resetcooldown",
    aliases: ["resetcooldowns", "resetcd"],
};