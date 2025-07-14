const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Import quest modules
const { startMonsterQuest } = require('./quest/monsterQuest.js');
const { startRiddleQuest } = require('./quest/riddleQuest.js');
const { startMazeQuest } = require('./quest/mazeQuest.js');
const { startTrolleyQuest } = require('./quest/trolleyQuest.js');
const { startMysteryQuest } = require('./quest/mysteryQuest.js');
const { startChestQuest } = require('./quest/chestQuest.js');

// Active quests storage
const activeQuests = new Map();
const questCollectors = new Map(); // Track collectors for cleanup

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
    },
    redlands: {
        name: "🔥 Crimson Badlands",
        description: "Scorched earth burns beneath a blood-red sky",
        second: "🌋 Volcanic Peaks",
        secondDescription: "Molten lava flows down jagged mountain slopes"
    },
    frostlands: {
        name: "❄️ Frozen Wastelands",
        description: "Endless ice fields stretch under crystal skies",
        second: "🏔️ Glacial Caverns",
        secondDescription: "Ancient ice formations gleam in ethereal light"
    },
    emeraldlands: {
        name: "🌿 Verdant Highlands",
        description: "Lush green valleys teem with vibrant life",
        second: "🌳 Primordial Grove",
        secondDescription: "Ancient trees hum with primal magical energy"
    }
};

// Quest types
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
    },
    mystery: {
        name: "🕵️ Detective Mystery",
        description: "Solve a murder mystery case"
    },
    chest: {
        name: "📦 Locked Chest",
        description: "Crack the color code to open a treasure chest"
    }
};

// Simple message sender utility
async function sendQuestMessage(channel, embed, components = []) {
    try {
        return await channel.send({ embeds: [embed], components: components });
    } catch (error) {
        console.error('Error sending quest message:', error);
        throw error;
    }
}

// Simple collector cleanup
function cleanupCollector(userId) {
    const collector = questCollectors.get(userId);
    if (collector) {
        collector.stop();
        questCollectors.delete(userId);
    }
}

module.exports.run = async (client, message, args) => {
    const userId = message.author.id;
    const channel = message.channel;

    // Check for debug mode (owner only)
    if (args[0] === 'debug') {
        if (userId !== '367445249376649217') {
            return channel.send("❌ This command is owner-only!");
        }
        if (!args[1]) {
            const debugEmbed = new EmbedBuilder()
                .setTitle("🔧 QUEST DEBUG COMMANDS")
                .setColor("#FFA500")
                .setDescription("**Owner-only debug commands for testing individual quest types**\n\n**Available Quest Names:**\n• `monster` - Combat quest with 2 monsters\n• `riddle` - Ancient riddle solving quest\n• `maze` - Hedge maze navigation quest\n• `trolley` - Moral dilemma trolley problem\n• `mystery` - Detective murder mystery case\n• `chest` - Mastermind color code chest puzzle")
                .addFields(
                    { name: "Usage", value: "`=quest debug <questname>`", inline: false }
                );

            return channel.send({ embeds: [debugEmbed] });
        }

        const questType = args[1].toLowerCase();
        if (!questTypes[questType]) {
            return channel.send("❌ Invalid quest type! Available: monster, riddle, maze, trolley, mystery, chest");
        }

        // Start debug quest immediately
        await startDebugQuest(channel, userId, questType);
        return;
    }

    // Check if user is already on a quest
    const memoryQuest = activeQuests.has(userId);
    const dbQuest = await db.get(`on_quest_${userId}`);

    if (memoryQuest || dbQuest) {
        if (memoryQuest && !dbQuest) {
            await db.set(`on_quest_${userId}`, true);
        } else if (!memoryQuest && dbQuest) {
            await db.delete(`on_quest_${userId}`);
        } else {
            return channel.send("❌ You are already on a quest! Complete it first before starting another.");
        }
    }

    // Check if user is dead
    const deathTimer = await db.get(`death_cooldown_${userId}`);
    if (deathTimer && Date.now() - deathTimer < 86400000) {
        return channel.send("💀 You cannot go on quests while dead! Use `=revive` first.");
    }

    // Create location selection embed
    const embed = new EmbedBuilder()
        .setTitle("🗺️ CHOOSE YOUR DESTINATION")
        .setColor("#FFD700")
        .setDescription("Select a location to explore. You must complete **TWO quests** to earn the 250 kopek reward!\n\n⚠️ Once started, you cannot engage in combat, gambling, or economic activities until completed!")
        .addFields(
            { name: locations.plains.name, value: `${locations.plains.description}\n*Leads to: ${locations.plains.second}*`, inline: true },
            { name: locations.forest.name, value: `${locations.forest.description}\n*Leads to: ${locations.forest.second}*`, inline: true },
            { name: locations.redlands.name, value: `${locations.redlands.description}\n*Leads to: ${locations.redlands.second}*`, inline: true },
            { name: locations.frostlands.name, value: `${locations.frostlands.description}\n*Leads to: ${locations.frostlands.second}*`, inline: true },
            { name: locations.emeraldlands.name, value: `${locations.emeraldlands.description}\n*Leads to: ${locations.emeraldlands.second}*`, inline: true },
            { name: "\u200B", value: "\u200B", inline: true }
        )
        .setFooter({ text: "⏰ You have 30 minutes to complete once started!" });

    // Create buttons
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('location_plains')
                .setLabel('🌾 Plains')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('location_forest')
                .setLabel('🌲 Forest')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('location_redlands')
                .setLabel('🔥 Badlands')
                .setStyle(ButtonStyle.Danger)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('location_frostlands')
                .setLabel('❄️ Wastelands')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('location_emeraldlands')
                .setLabel('🌿 Highlands')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('quest_cancel')
                .setLabel('❌ Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    const questMessage = await sendQuestMessage(channel, embed, [row1, row2]);

    // Set up collector
    const filter = (interaction) => interaction.user.id === userId;
    const collector = questMessage.createMessageComponentCollector({
        filter,
        time: 60000 // 1 minute to choose
    });

    questCollectors.set(userId, collector);

    collector.on('collect', async (interaction) => {
        try {
            await interaction.deferReply();

            if (interaction.customId === 'quest_cancel') {
                const cancelEmbed = new EmbedBuilder()
                    .setTitle("❌ Quest Cancelled")
                    .setColor("#FF0000")
                    .setDescription("You decided not to embark on a quest today.");

                await interaction.editReply({ embeds: [cancelEmbed] });
                cleanupCollector(userId);
                return;
            }

            // Start the selected location
            const location = interaction.customId.replace('location_', '');
            await startLocationQuest(interaction, location, userId);
            cleanupCollector(userId);
        } catch (error) {
            console.error('Error in quest collector:', error);
            try {
                await interaction.editReply({ content: "❌ An error occurred starting your quest." });
            } catch (e) {
                console.error('Error sending error message:', e);
            }
            cleanupCollector(userId);
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && !collected.size) {
            const timeoutEmbed = new EmbedBuilder()
                .setTitle("⏰ Quest Selection Timeout")
                .setColor("#FF0000")
                .setDescription("You took too long to choose a location.");

            questMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(console.error);
        }
        questCollectors.delete(userId);
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
    const timeoutId = setTimeout(async () => {
        const quest = activeQuests.get(userId);
        if (quest) {
            cleanupCollector(userId);
            activeQuests.delete(userId);
            await db.delete(`on_quest_${userId}`);

            try {
                await interaction.followUp({
                    embeds: [new EmbedBuilder()
                        .setTitle("⏰ Quest Timeout")
                        .setColor("#FF0000")
                        .setDescription("Your quest has timed out after 30 minutes. You can start a new quest when ready.")]
                });
            } catch (err) {
                console.log("Failed to send timeout message:", err);
            }
        }
    }, 1800000); // 30 minutes

    questData.timeoutId = timeoutId;

    // Randomly select first quest type
    const questTypeNames = Object.keys(questTypes);
    const randomQuest = questTypeNames[Math.floor(Math.random() * questTypeNames.length)];
    questData.currentQuest = randomQuest;

    const locationData = locations[location];
    const embed = new EmbedBuilder()
        .setTitle(`${locationData.name} - Ready to Begin`)
        .setColor("#4169E1")
        .setDescription(`You arrive at the ${locationData.name.toLowerCase()}. ${locationData.description}.\n\nA ${questTypes[randomQuest].name} awaits you!`)
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

    await interaction.editReply({ embeds: [embed], components: [continueRow] });

    // Set up start quest collector
    const filter = (i) => i.user.id === userId;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 1800000 });
    questCollectors.set(userId, collector);

    collector.on('collect', async (i) => {
        try {
            if (i.customId === 'quest_start_first') {
                await i.deferReply();
                await startSpecificQuest(i, userId, randomQuest);
                cleanupCollector(userId);
            }
        } catch (error) {
            console.error('Error starting specific quest:', error);
            cleanupCollector(userId);
        }
    });
}

async function startSpecificQuest(interaction, userId, questType) {
    try {
        switch (questType) {
            case 'monster':
                await startMonsterQuest(interaction, userId, activeQuests);
                break;
            case 'riddle':
                await startRiddleQuest(interaction, userId, activeQuests);
                break;
            case 'maze':
                await startMazeQuest(interaction, userId, activeQuests);
                break;
            case 'trolley':
                await startTrolleyQuest(interaction, userId, activeQuests);
                break;
            case 'mystery':
                await startMysteryQuest(interaction, userId, activeQuests);
                break;
            case 'chest':
                await startChestQuest(interaction, userId, activeQuests);
                break;
        }
    } catch (error) {
        console.error(`Error starting ${questType} quest:`, error);
        await endQuest(interaction, userId, false, "An error occurred starting your quest.", activeQuests);
    }
}

async function completeQuest(interaction, userId, activeQuests, trolleyMessage = null) {
    const quest = activeQuests.get(userId);
    if (!quest) return;

    // Prevent race conditions
    if (quest.processing) return;
    quest.processing = true;

    // Handle debug mode
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
        let totalReward = 250;
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

        // Store the quest type for the next quest
        quest.currentQuest = randomQuest;

        try {
            await interaction.editReply({ embeds: [embed], components: [] });
        } catch (error) {
            // Fallback to followUp if editReply fails
            await interaction.followUp({ embeds: [embed], components: [] });
        }

        // Start second quest after delay
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

            try {
                const message = await interaction.followUp({ embeds: [continueEmbed], components: [continueRow] });

                // Set up collector for second quest
                const filter = (i) => i.user.id === userId;
                const collector = message.createMessageComponentCollector({ filter, time: 1800000 });
                questCollectors.set(userId, collector);

                collector.on('collect', async (i) => {
                    try {
                        if (i.customId === 'quest_start_second') {
                            await i.deferReply();
                            await startSpecificQuest(i, userId, randomQuest);
                            cleanupCollector(userId);
                        }
                    } catch (error) {
                        console.error('Error starting second quest:', error);
                        cleanupCollector(userId);
                    }
                });
            } catch (error) {
                console.error('Error sending second quest message:', error);
            }
        }, 2000);
    }
}

async function endQuest(interaction, userId, success, message, activeQuests) {
    const quest = activeQuests.get(userId);
    if (quest) {
        quest.processing = false;
        if (quest.timeoutId) {
            clearTimeout(quest.timeoutId);
        }
    }

    cleanupCollector(userId);
    activeQuests.delete(userId);
    await db.delete(`on_quest_${userId}`);

    const embed = new EmbedBuilder()
        .setTitle(success ? "✅ Quest Complete!" : "❌ Quest Failed")
        .setColor(success ? "#00FF00" : "#FF0000")
        .setDescription(message);

    try {
        await interaction.editReply({ embeds: [embed], components: [] });
    } catch (error) {
        try {
            await interaction.followUp({ embeds: [embed], components: [] });
        } catch (followUpError) {
            console.error('Failed to send quest end message:', followUpError);
        }
    }
}

async function startDebugQuest(channel, userId, questType) {
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
    const timeoutId = setTimeout(async () => {
        if (activeQuests.has(userId)) {
            activeQuests.delete(userId);
            await db.delete(`on_quest_${userId}`);

            try {
                await channel.send("⏰ Your debug quest has timed out after 30 minutes.");
            } catch (err) {
                console.log("Failed to send timeout message:", err);
            }
        }
    }, 1800000);

    questData.timeoutId = timeoutId;

    const embed = new EmbedBuilder()
        .setTitle(`🔧 DEBUG QUEST - ${questTypes[questType].name}`)
        .setColor("#FFA500")
        .setDescription(`**Debug Mode Activated**\n\nTesting: ${questTypes[questType].description}\n\nStarting in 2 seconds...`)
        .addFields(
            { name: "Quest Type", value: questType, inline: false }
        );

    const debugMessage = await sendQuestMessage(channel, embed);

    // Start the specific quest after delay
    setTimeout(async () => {
        // Create a fake interaction for debug mode
        const fakeInteraction = {
            editReply: async (options) => await debugMessage.edit(options),
            followUp: async (options) => await channel.send(options),
            user: { id: userId },
            channel: channel,
            deferReply: async () => { /* no-op */ },
            replied: true
        };

        await startSpecificQuest(fakeInteraction, userId, questType);
    }, 2000);
}

// Function to check if user is on quest (for use in other commands)
async function isOnQuest(userId) {
    return activeQuests.has(userId) || await db.get(`on_quest_${userId}`);
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