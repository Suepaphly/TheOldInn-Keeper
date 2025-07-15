const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    const userId = message.author.id;

    // Check if user is on a quest
    const { isOnQuest } = require("../quest.js");
    const onQuest = await isOnQuest(userId);

    if (!onQuest) {
        return message.channel.send(`❌ You are not currently on a quest!`);
    }

    // End the user's own quest
    try {
        // Import the quest module to access activeQuests
        const questModule = require("../quest.js");

        // Remove from active quests map if it exists
        if (questModule.activeQuests && questModule.activeQuests.has(userId)) {
            questModule.activeQuests.delete(userId);
        }

        // Clean up database
        await db.delete(`on_quest_${userId}`);

        const embed = new Discord.EmbedBuilder()
            .setTitle("🛑 Quest Ended")
            .setColor("#FF6600")
            .setDescription(`Your quest has been ended. You can start a new quest when ready.`)
            .addFields(
                { name: "User", value: message.author.username, inline: true }
            );

        message.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error("Error ending quest:", error);
        message.channel.send("❌ An error occurred while trying to end your quest. You may not be on a quest or there was a database error.");
    }
};

module.exports.help = {
    name: "endquest",
    aliases: ["stopquest", "quitquest"]
};