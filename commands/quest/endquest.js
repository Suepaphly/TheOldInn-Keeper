
const { EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    help: {
        name: "endquest",
        aliases: ["stopquest", "quitquest"]
    },
    run: async (client, message, args) => {
        const userId = message.author.id;

        // Import the quest module to access activeQuests and functions
        const questModule = require("../quest.js");
        
        // Check if user is on a quest
        const onQuest = await questModule.isOnQuest(userId);

        if (!onQuest) {
            return message.channel.send(`❌ You are not currently on a quest!`);
        }

        // End the user's own quest
        try {
            // Remove from active quests map if it exists
            if (questModule.activeQuests && questModule.activeQuests.has(userId)) {
                questModule.activeQuests.delete(userId);
            }

            // Clean up database
            await db.delete(`on_quest_${userId}`);
            
            // Clean up any related quest data
            const memoryManager = require("../../utility/memoryManager.js");
            await memoryManager.syncActiveQuests();

            const embed = new EmbedBuilder()
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
    }
};
