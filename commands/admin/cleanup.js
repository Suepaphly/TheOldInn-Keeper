
const QuestCleanup = require('../../utility/questCleanup.js');
const config = require('../../config.json');

module.exports = {
    help: {
        name: "cleanup",
        description: "Clean up quest system and database (Admin only)"
    },
    run: async (client, message, args) => {
        // Check if user is admin
        if (message.author.id !== config.ownerID) {
            return message.channel.send("❌ This command is for administrators only.");
        }
        
        try {
            const action = args[0]?.toLowerCase();
            
            switch (action) {
                case 'all':
                    const allResult = await QuestCleanup.clearAllQuestStates();
                    if (allResult.success) {
                        message.channel.send(`✅ **Full cleanup completed!**\nCleared ${allResult.cleanedCount} database entries.`);
                    } else {
                        message.channel.send(`❌ **Cleanup failed:** ${allResult.error}`);
                    }
                    break;
                    
                case 'user':
                    const userId = args[1];
                    if (!userId) {
                        return message.channel.send("❌ Please provide a user ID: `=cleanup user <userid>`");
                    }
                    
                    const userResult = await QuestCleanup.clearUserQuest(userId);
                    if (userResult.success) {
                        message.channel.send(`✅ **User cleanup completed!**\nCleared ${userResult.cleanedCount} entries for user ${userId}.`);
                    } else {
                        message.channel.send(`❌ **User cleanup failed:** ${userResult.error}`);
                    }
                    break;
                    
                case 'death':
                    const deathResult = await QuestCleanup.clearExpiredDeathCooldowns();
                    if (deathResult.success) {
                        message.channel.send(`✅ **Death cooldown cleanup completed!**\nCleared ${deathResult.cleanedCount} expired cooldowns.`);
                    } else {
                        message.channel.send(`❌ **Death cleanup failed:** ${deathResult.error}`);
                    }
                    break;
                    
                case 'report':
                case 'diagnostic':
                    const report = await QuestCleanup.diagnosticReport();
                    if (report) {
                        message.channel.send(
                            `📊 **Quest System Diagnostic Report**\n` +
                            `\`\`\`\n` +
                            `Active Quests: ${report.activeQuests}\n` +
                            `Combat States: ${report.combatStates}\n` +
                            `Temp States: ${report.tempStates}\n` +
                            `Protection States: ${report.protectionStates}\n` +
                            `Quest Data: ${report.questData}\n` +
                            `Death Cooldowns: ${report.deathCooldowns}\n` +
                            `Total Cleanup Candidates: ${report.totalPotentialCleanup}\n` +
                            `\`\`\`\n` +
                            `Use \`=cleanup all\` to clear all temporary states.`
                        );
                    } else {
                        message.channel.send("❌ Failed to generate diagnostic report.");
                    }
                    break;
                    
                default:
                    message.channel.send(
                        `🧹 **Quest Cleanup Commands**\n` +
                        `\`=cleanup all\` - Clear all quest states and temp data\n` +
                        `\`=cleanup user <userid>\` - Clear quest data for specific user\n` +
                        `\`=cleanup death\` - Clear expired death cooldowns\n` +
                        `\`=cleanup report\` - Show diagnostic report\n\n` +
                        `**Note:** This will clear any lingering button interactions, quest states, and database inconsistencies.`
                    );
                    break;
            }
            
        } catch (error) {
            console.error('Cleanup command error:', error);
            message.channel.send("❌ An error occurred during cleanup.");
        }
    }
};
