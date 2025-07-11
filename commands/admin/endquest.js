
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    const ownerID = [
        "367445249376649217"
    ];
    
    if (!ownerID.includes(message.author.id)) {
        return message.channel.send("❌ Only the bot owner can use this command!");
    }

    const target = message.mentions.users.first() || 
                  (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);

    if (!target) {
        return message.channel.send("❌ You must mention a user or provide a user ID! Usage: `=endquest @user` or `=endquest <userID>`");
    }

    // Check if user is on a quest
    const { isOnQuest } = require("../quest.js");
    const onQuest = await isOnQuest(target.id);

    if (!onQuest) {
        return message.channel.send(`❌ ${target.username} is not currently on a quest!`);
    }

    // Force end the quest
    try {
        // Import the quest module to access activeQuests
        const questModule = require("../quest.js");
        
        // Remove from active quests map if it exists
        if (questModule.activeQuests && questModule.activeQuests.has(target.id)) {
            questModule.activeQuests.delete(target.id);
        }
        
        // Clean up database
        await db.delete(`on_quest_${target.id}`);

        const embed = new Discord.EmbedBuilder()
            .setTitle("⚡ Quest Force Ended")
            .setColor("#FF6600")
            .setDescription(`${target.username}'s quest has been forcibly ended by the bot owner.`)
            .addFields(
                { name: "Target User", value: target.username, inline: true },
                { name: "Ended By", value: message.author.username, inline: true }
            );

        message.channel.send({ embeds: [embed] });

        // Try to notify the user if possible
        try {
            const dmEmbed = new Discord.EmbedBuilder()
                .setTitle("🛑 Quest Terminated")
                .setColor("#FF0000")
                .setDescription("Your quest has been forcibly ended by the bot administrator. You can start a new quest when ready.");
            
            await target.send({ embeds: [dmEmbed] });
        } catch (err) {
            // User has DMs disabled or bot can't DM them
            console.log(`Could not DM ${target.username} about quest termination`);
        }

    } catch (error) {
        console.error("Error ending quest:", error);
        message.channel.send("❌ An error occurred while trying to end the quest. The user may not be on a quest or there was a database error.");
    }
};

module.exports.help = {
    name: "endquest",
    aliases: ["forceendquest", "stopquest"]
};id}`);

        const embed = new Discord.EmbedBuilder()
            .setTitle("⚡ Quest Force Ended")
            .setColor("#FF6600")
            .setDescription(`${target.username}'s quest has been forcibly ended by the bot owner.`)
            .addFields(
                { name: "Target User", value: target.username, inline: true },
                { name: "Ended By", value: message.author.username, inline: true }
            );

        message.channel.send({ embeds: [embed] });

        // Try to notify the user if possible
        try {
            const dmEmbed = new Discord.EmbedBuilder()
                .setTitle("🛑 Quest Terminated")
                .setColor("#FF0000")
                .setDescription("Your quest has been forcibly ended by the bot administrator. You can start a new quest when ready.");
            
            await target.send({ embeds: [dmEmbed] });
        } catch (err) {
            // User has DMs disabled or bot can't DM them
            console.log(`Could not DM ${target.username} about quest termination`);
        }

    } catch (error) {
        console.error("Error ending quest:", error);
        message.channel.send("❌ An error occurred while trying to end the quest. The user may not be on a quest or there was a database error.");
    }
};

module.exports.help = {
    name: "endquest",
    aliases: ["forceendquest", "stopquest"]
};
