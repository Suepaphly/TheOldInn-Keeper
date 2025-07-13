const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Import quest modules
const { startMonsterQuest } = require('./quest/monsterQuest.js');
const { startRiddleQuest } = require('./quest/riddleQuest.js');
const { startMazeQuest } = require('./quest/mazeQuest.js');
const { startTrolleyQuest } = require('./quest/trolleyQuest.js');

// Active quests storage
const activeQuests = new Map();

// Location data
const locations = {
    plains: {
        name: "🌾 Wide Open Plains",
        description: "Rolling grasslands stretch to the horizon",
        second: "🏰 Ruined Castle",
        secondDescription: "Ancient stones crumble in forgotten halls"
    },
    forest: {
        name: "🌲 Dark Forest",
        description: "Twisted trees whisper ancient secrets",
        second: "🕳️ Underground Caves",
        secondDescription: "Deep tunnels echo with mysterious sounds"
    }
};

// Quest types and their monster values
const questTypes = {
    monster: {
        name: "⚔️ Ambush",
        description: "Fight off an ambush of monsters"
    },
    riddle: {
        name: "🧩 Ancient Riddle",
        description: "Solve mysterious riddles"
    },
    maze: {
        name: "🌿 Hedge Maze",
        description: "Navigate through a dangerous maze"
    },
    trolley: {
        name: "🚃 Moral Dilemma",
        description: "Face an impossible choice"
    }
};

module.exports.run = async (client, message, args) => {
    const userId = message.author.id;

    // Check for debug mode (owner only)
    if (args[0] === 'debug') {
        if (userId !== '367445249376649217') { // Bot owner ID from endquest.js
            return message.channel.send("❌ This command is owner-only!");
        }
        if (!args[1]) {
            const debugEmbed = new EmbedBuilder()
                .setTitle("🔧 QUEST DEBUG COMMANDS")
                .setColor("#FFA500")
                .setDescription("**Owner-only debug commands for testing individual quest types**\n\n**Available Quest Names:**\n• `monster` - Combat quest with 2 monsters\n• `riddle` - Ancient riddle solving quest\n• `maze` - Hedge maze navigation quest\n• `trolley` - Moral dilemma trolley problem")
                .addFields(
                    { name: "Usage", value: "`=quest debug <questname>`", inline: false },
                    { name: "Quest Details", value: "🗡️ **monster** - Fight Goblin Scout → Orc Raider\n🧩 **riddle** - Solve 2 random riddles (death on failure)\n🌿 **maze** - Navigate 2-stage maze with traps/combat\n🚃 **trolley** - Face moral choices with vengeance risk", inline: false },
                    { name: "Debug Features", value: "• Complete after 1 quest instead of 2\n• 30-minute timeout still applies\n• No real rewards given", inline: false }
                );

            return message.channel.send({ embeds: [debugEmbed] });
        }

        const questType = args[1].toLowerCase();
        if (!questTypes[questType]) {
            return message.channel.send("❌ Invalid quest type! Available: monster, riddle, maze, trolley");
        }

        // Start debug quest immediately
        await startDebugQuest(message, userId, questType);
        return;
    }

    // Check if user is already on a quest
    if (activeQuests.has(userId)) {
        return message.channel.send("❌ You are already on a quest! Complete it first before starting another.");
    }

    // Check if user is dead
    const deathTimer = await db.get(`death_cooldown_${userId}`);
    if (deathTimer && Date.now() - deathTimer < 86400000) { // 24 hours
        return message.channel.send("💀 You cannot go on quests while dead! Use `=revive` first.");
    }

    // Create location selection embed
    const embed = new EmbedBuilder()
        .setTitle("🗺️ CHOOSE YOUR DESTINATION")
        .setColor("#FFD700")
        .setDescription("Select a location to explore. You must complete **TWO quests** to earn the 250 kopek reward!\n\n⚠️ Once started, you cannot engage in combat, gambling, or economic activities until completed!")
        .addFields(
            { name: locations.plains.name, value: `${locations.plains.description}\n*Leads to: ${locations.plains.second}*`, inline: false },
            { name: locations.forest.name, value: `${locations.forest.description}\n*Leads to: ${locations.forest.second}*`, inline: false }
        )
        .setFooter({ text: "⏰ You have 30 minutes to complete once started!" });

    // Create buttons
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('location_plains')
                .setLabel('🌾 Wide Open Plains')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('location_forest')
                .setLabel('🌲 Dark Forest')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('quest_cancel')
                .setLabel('❌ Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    const questMessage = await message.channel.send({ 
        embeds: [embed], 
        components: [row] 
    });

    // Set up collector
    const filter = (interaction) => {
        return interaction.user.id === message.author.id;
    };

    const collector = questMessage.createMessageComponentCollector({
        filter,
        time: 60000 // 1 minute to choose
    });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'quest_cancel') {
            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setTitle("❌ Quest Cancelled")
                    .setColor("#FF0000")
                    .setDescription("You decided not to embark on a quest today.")],
                components: []
            });
            collector.stop();
            return;
        }

        // Start the selected location
        const location = interaction.customId.replace('location_', '');
        await startLocationQuest(interaction, location, userId);
        collector.stop();
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && !collected.size) {
            questMessage.edit({
                embeds: [new EmbedBuilder()
                    .setTitle("⏰ Quest Selection Timeout")
                    .setColor("#FF0000")
                    .setDescription("You took too long to choose a location.")],
                components: []
            });
        }
    });
};

async function startLocationQuest(interaction, location, userId) {
    // Mark user as on quest
    const questData = {
        location: location,
        startTime: Date.now(),
        questsCompleted: 0,
        totalMonsterValue: 0,
        currentQuest: null
    };

    activeQuests.set(userId, questData);
    await db.set(`on_quest_${userId}`, true);

    // Set 30 minute timeout
    setTimeout(async () => {
        if (activeQuests.has(userId)) {
            activeQuests.delete(userId);
            await db.delete(`on_quest_${userId}`);

            const timeoutEmbed = new EmbedBuilder()
                .setTitle("⏰ Quest Timeout")
                .setColor("#FF0000")
                .setDescription("Your quest has timed out after 30 minutes. You can start a new quest when ready.");

            try {
                await interaction.followUp({ embeds: [timeoutEmbed] });
            } catch (err) {
                console.log("Failed to send timeout message:", err);
            }
        }
    }, 1800000); // 30 minutes

    // Randomly select first quest type
    const questTypeNames = Object.keys(questTypes);
    const randomQuest = questTypeNames[Math.floor(Math.random() * questTypeNames.length)];

    const locationData = locations[location];
    const embed = new EmbedBuilder()
        .setTitle(`${locationData.name} - Quest 1/2`)
        .setColor("#4169E1")
        .setDescription(`You arrive at the ${locationData.name.toLowerCase()}. ${locationData.description}.\n\nA ${questTypes[randomQuest].name} awaits you!`)
        .addFields(
            { name: "Progress", value: "0/2 quests completed", inline: false }
        );

    try {
        await interaction.update({ embeds: [embed], components: [] });
    } catch (error) {
        if (error.code === 10062) {
            // Interaction expired, send a new message instead
            await interaction.followUp({ embeds: [embed], components: [] });
        } else {
            console.error('Error updating interaction:', error);
            throw error;
        }
    }

    // Add a continue button for better pacing
    setTimeout(async () => {
        const continueEmbed = new EmbedBuilder()
            .setTitle(`${locationData.name} - Ready to Begin`)
            .setColor("#4169E1")
            .setDescription(`You steel yourself for what lies ahead. A ${questTypes[randomQuest].name} awaits!`)
            .addFields(
                { name: "Progress", value: "0/2 quests completed", inline: false },
                { name: "Quest Type", value: questTypes[randomQuest].description, inline: false }
            );

        const continueRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('quest_start_first')
                    .setLabel('⚔️ Begin Quest')
                    .setStyle(ButtonStyle.Primary)
            );

        interaction.editReply({ embeds: [continueEmbed], components: [continueRow] }).catch(() => {
            interaction.followUp({ embeds: [continueEmbed], components: [continueRow] });
        });

        // Set up collector for start button
        const filter = (i) => i.user.id === userId;
        
        // Get the message for the collector
        let message;
        try {
            if (interaction.replied || interaction.deferred) {
                message = await interaction.fetchReply();
            } else {
                message = interaction.message;
            }
        } catch (error) {
            console.error('Error getting message for second quest collector:', error);
            return;
        }
        
        const startCollector = message.createMessageComponentCollector({ filter, time: 1800000 });

        startCollector.on('collect', async (i) => {
            if (i.customId === 'quest_start_first') {
                questData.currentQuest = randomQuest;

                switch (randomQuest) {
                    case 'monster':
                        await startMonsterQuest(i, userId, activeQuests);
                        break;
                    case 'riddle':
                        await startRiddleQuest(i, userId, activeQuests);
                        break;
                    case 'maze':
                        await startMazeQuest(i, userId, activeQuests);
                        break;
                    case 'trolley':
                        await startTrolleyQuest(i, userId, activeQuests);
                        break;
                }
                startCollector.stop();
            }
        });
    }, 2000);
}

async function completeQuest(interaction, userId, activeQuests, trolleyMessage = null) {
    const quest = activeQuests.get(userId);
    if (!quest) return;

    // Handle debug mode - complete immediately
    if (quest.isDebug) {
        let rewardText = "🔧 **DEBUG QUEST COMPLETED!**\n\nThis was a test quest - no rewards given.";
        if (trolleyMessage) {
            rewardText = `${trolleyMessage}\n\n${rewardText}`;
        }
        await endQuest(interaction, userId, true, rewardText, activeQuests);
        return;
    }

    quest.questsCompleted++;

    if (quest.questsCompleted >= 2) {
        // Both quests completed - give final reward
        let totalReward = 250; // Base reward
        let rewardText = "You have completed both quests and earned 250 kopeks!";

        if (quest.totalMonsterValue > 0) {
            const monsterBonus = Math.floor(quest.totalMonsterValue / 2);
            totalReward += monsterBonus;
            rewardText = `You have completed both quests and earned 250 kopeks + ${monsterBonus} kopeks bonus from slaying monsters (total: ${totalReward} kopeks)!`;
        }

        if (trolleyMessage) {
            rewardText = `${trolleyMessage}\n\n${rewardText}`;
        }

        await db.add(`money_${userId}`, totalReward);
        await endQuest(interaction, userId, true, rewardText, activeQuests);
    } else {
        // First quest completed, move to second location
        const location = locations[quest.location];

        let completionMessage = "Quest completed!";
        if (trolleyMessage) {
            completionMessage = trolleyMessage;
        }

        // Randomly select second quest type
        const questTypeNames = Object.keys(questTypes);
        const randomQuest = questTypeNames[Math.floor(Math.random() * questTypeNames.length)];

        const embed = new EmbedBuilder()
            .setTitle(`${location.second} - Quest 2/2`)
            .setColor("#4169E1")
            .setDescription(`${completionMessage}\n\nYou advance to ${location.second}. ${location.secondDescription}.\n\nA ${questTypes[randomQuest].name} awaits you!`)
            .addFields(
                { name: "Progress", value: "1/2 quests completed", inline: false }
            );

        try {
                // Check if interaction has already been replied to or deferred
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ embeds: [embed], components: [] });
                } else {
                    await interaction.update({ embeds: [embed], components: [] });
                }
            } catch (error) {
                if (error.code === 10062 || error.code === 'InteractionNotReplied') {
                    // Interaction expired or not replied, send a new message instead
                    await interaction.followUp({ embeds: [embed], components: [] });
                } else {
                    console.error('Error updating interaction:', error);
                    throw error;
                }
            }

        // Add a continue button for better pacing
        setTimeout(async () => {
            const continueEmbed = new EmbedBuilder()
                .setTitle(`${location.second} - Ready for Final Challenge`)
                .setColor("#4169E1")
                .setDescription(`You prepare for the final challenge. A ${questTypes[randomQuest].name} awaits!`)
                .addFields(
                    { name: "Progress", value: "1/2 quests completed", inline: false },
                    { name: "Final Quest Type", value: questTypes[randomQuest].description, inline: false }
                );

            const continueRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('quest_start_second')
                        .setLabel('⚔️ Begin Final Quest')
                        .setStyle(ButtonStyle.Primary)
                );

            interaction.editReply({ embeds: [continueEmbed], components: [continueRow] }).catch(() => {
                interaction.followUp({ embeds: [continueEmbed], components: [continueRow] });
            });

            // Set up collector for start button
            const filter = (i) => i.user.id === userId;
            
            // Get the message for the collector
            let message;
            try {
                if (interaction.replied || interaction.deferred) {
                    message = await interaction.fetchReply();
                } else {
                    message = interaction.message;
                }
            } catch (error) {
                console.error('Error getting message for second quest collector:', error);
                return;
            }
            
            const startCollector = message.createMessageComponentCollector({ filter, time: 1800000 });

            startCollector.on('collect', async (i) => {
                if (i.customId === 'quest_start_second') {
                    quest.currentQuest = randomQuest;

                    switch (randomQuest) {
                        case 'monster':
                            await startMonsterQuest(i, userId, activeQuests);
                            break;
                        case 'riddle':
                            await startRiddleQuest(i, userId, activeQuests);
                            break;
                        case 'maze':
                            await startMazeQuest(i, userId, activeQuests);
                            break;
                        case 'trolley':
                            await startTrolleyQuest(i, userId, activeQuests);
                            break;
                    }
                    startCollector.stop();
                }
            });
        }, 2000);
    }
}

async function endQuest(interaction, userId, success, message, activeQuests) {
    activeQuests.delete(userId);
    await db.delete(`on_quest_${userId}`);

    const embed = new EmbedBuilder()
        .setTitle(success ? "✅ Quest Complete!" : "❌ Quest Failed")
        .setColor(success ? "#00FF00" : "#FF0000")
        .setDescription(message);

    try {
        // Check if interaction has already been replied to or deferred
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components: [] });
        } else {
            await interaction.update({ embeds: [embed], components: [] });
        }
    } catch (error) {
        if (error.code === 10062 || error.code === 'InteractionNotReplied') {
            // Interaction expired or not replied, try to reply first then followUp
            try {
                await interaction.reply({ embeds: [embed], components: [] });
            } catch (replyError) {
                // If reply also fails, try deferring first then editing
                try {
                    await interaction.deferReply();
                    await interaction.editReply({ embeds: [embed], components: [] });
                } catch (deferError) {
                    console.error('All interaction methods failed:', { error, replyError, deferError });
                }
            }
        } else {
            console.error('Error updating interaction:', error);
            throw error;
        }
    }
}

// Function to check if user is on quest (for use in other commands)
async function isOnQuest(userId) {
    return activeQuests.has(userId) || await db.get(`on_quest_${userId}`);
}

async function startDebugQuest(message, userId, questType) {
    // Mark user as on debug quest
    const questData = {
        location: 'debug',
        startTime: Date.now(),
        questsCompleted: 0,
        totalMonsterValue: 0,
        currentQuest: questType,
        isDebug: true
    };

    activeQuests.set(userId, questData);
    await db.set(`on_quest_${userId}`, true);

    // Set 30 minute timeout
    setTimeout(async () => {
        if (activeQuests.has(userId)) {
            activeQuests.delete(userId);
            await db.delete(`on_quest_${userId}`);

            const timeoutEmbed = new EmbedBuilder()
                .setTitle("⏰ Debug Quest Timeout")
                .setColor("#FF0000")
                .setDescription("Your debug quest has timed out after 30 minutes.");

            try {
                await message.channel.send({ embeds: [timeoutEmbed] });
            } catch (err) {
                console.log("Failed to send timeout message:", err);
            }
        }
    }, 1800000); // 30 minutes

    const embed = new EmbedBuilder()
        .setTitle(`🔧 DEBUG QUEST - ${questTypes[questType].name}`)
        .setColor("#FFA500")
        .setDescription(`**Debug Mode Activated**\n\nTesting: ${questTypes[questType].description}\n\nStarting in 2 seconds...`)
        .addFields(
            { name: "Quest Type", value: questType, inline: false }
        );

    const debugMessage = await message.channel.send({ embeds: [embed] });

    // Start the specific quest after delay
    setTimeout(() => {
        // Create a fake interaction object for compatibility
        const fakeInteraction = {
            update: async (options) => await debugMessage.edit(options),
            editReply: async (options) => await debugMessage.edit(options),
            fetchReply: async () => debugMessage,
            followUp: async (options) => await message.channel.send(options),
            reply: async (options) => await message.channel.send(options),
            deferReply: async () => { /* No-op for debug */ },
            message: debugMessage,
            user: message.author,
            replied: true,
            deferred: false,
            channel: message.channel,
            customId: null,
            // Add proper interaction state tracking
            acknowledged: false,
            acknowledge: function() { this.acknowledged = true; },
            // Override methods to handle debug state properly
            safeUpdate: async function(options) {
                try {
                    if (!this.acknowledged) {
                        this.acknowledged = true;
                        return await debugMessage.edit(options);
                    } else {
                        return await message.channel.send(options);
                    }
                } catch (error) {
                    console.error('Debug interaction update failed:', error);
                    return await message.channel.send(options);
                }
            }
        };

        switch (questType) {
            case 'monster':
                startMonsterQuest(fakeInteraction, userId, activeQuests);
                break;
            case 'riddle':
                startRiddleQuest(fakeInteraction, userId, activeQuests);
                break;
            case 'maze':
                startMazeQuest(fakeInteraction, userId, activeQuests);
                break;
            case 'trolley':
                startTrolleyQuest(fakeInteraction, userId, activeQuests);
                break;
        }
    }, 2000);
}

module.exports.help = {
    name: "quest",
    aliases: ["q", "adventure"],
    enabled: true
};

module.exports.isOnQuest = isOnQuest;
module.exports.endQuest = endQuest;
module.exports.completeQuest = completeQuest;
module.exports.activeQuests = activeQuests;
module.exports.enabled = true;