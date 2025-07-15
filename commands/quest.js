
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require("quick.db");
const config = require('../config.json');
const db = new QuickDB();

// Import quest types
const CombatSystem = require('./quest/combatSystem.js');
const { startMonsterQuest } = require('./quest/monsterQuest.js');
const { startChestQuest } = require('./quest/chestQuest.js');
const { startMazeQuest } = require('./quest/mazeQuest.js');
const { startRiddleQuest } = require('./quest/riddleQuest.js');
const { startMysteryQuest } = require('./quest/mysteryQuest.js');
const { startTrolleyQuest } = require('./quest/trolleyQuest.js');

// Quest system state
const activeQuests = new Map();

// Location definitions
const locations = {
    plains: {
        name: "🌾 Wide Open Plains",
        description: "Rolling grasslands stretch to the horizon",
        nextLocation: "🏰 Ruined Castle"
    },
    forest: {
        name: "🌲 Dark Forest", 
        description: "Twisted trees whisper ancient secrets",
        nextLocation: "🕳️ Underground Caves"
    },
    badlands: {
        name: "🔥 Crimson Badlands",
        description: "Scorched earth burns beneath a blood-red sky", 
        nextLocation: "🌋 Volcanic Peaks"
    },
    wastelands: {
        name: "❄️ Frozen Wastelands",
        description: "Endless ice fields stretch under crystal skies",
        nextLocation: "🏔️ Glacial Caverns"
    },
    highlands: {
        name: "🌿 Verdant Highlands",
        description: "Lush green valleys teem with vibrant life",
        nextLocation: "🌳 Primordial Grove"
    }
};

// Quest type definitions
const questTypes = {
    monster: { name: "🐗 Monster Hunt", handler: startMonsterQuest },
    chest: { name: "🗝️ Locked Chest", handler: startChestQuest },
    maze: { name: "🌀 Maze Navigation", handler: startMazeQuest },
    riddle: { name: "🧩 Ancient Riddle", handler: startRiddleQuest },
    mystery: { name: "🔍 Mystery Box", handler: startMysteryQuest },
    trolley: { name: "🚃 Moral Dilemma", handler: startTrolleyQuest }
};

const questTypeNames = Object.keys(questTypes);

module.exports = {
    help: {
        name: "quest",
        description: "Embark on a dangerous quest for rewards!"
    },
    run: async (client, message, args) => {
        try {
            const userId = message.author.id;
            
            // Check for debug mode (owner only)
            if (args[0] === 'debug' && message.author.id === config.ownerID) {
                const questType = args[1];
                if (questType && questTypes[questType]) {
                    return await startDebugQuest(message, userId, questType);
                } else {
                    return message.channel.send("Valid quest types: " + questTypeNames.join(", "));
                }
            }
            
            // Check if user is already on a quest
            if (await isOnQuest(userId)) {
                return message.channel.send("❌ You're already on a quest! Complete it first.");
            }
            
            // Check death cooldown
            const deathCooldown = await db.get(`death_cooldown_${userId}`);
            if (deathCooldown && Date.now() - deathCooldown < 86400000) { // 24 hours in milliseconds
                const timeLeft = Math.ceil((86400000 - (Date.now() - deathCooldown)) / 1000 / 60);
                return message.channel.send(`💀 You're still recovering from death! Wait ${timeLeft} more minutes.`);
            }
            
            // Create location selection embed
            const embed = new EmbedBuilder()
                .setTitle("🗺️ CHOOSE YOUR DESTINATION")
                .setColor("#4169E1")
                .setDescription("Select a location to explore. You must complete TWO quests to earn the 250 kopek reward!\n\n⚠️ Once started, you cannot engage in combat, gambling, or economic activities until completed!")
                .addFields(
                    { name: "🌾 Wide Open Plains", value: `Rolling grasslands stretch to the horizon\nLeads to: 🏰 Ruined Castle`, inline: false },
                    { name: "🌲 Dark Forest", value: `Twisted trees whisper ancient secrets\nLeads to: 🕳️ Underground Caves`, inline: false },
                    { name: "🔥 Crimson Badlands", value: `Scorched earth burns beneath a blood-red sky\nLeads to: 🌋 Volcanic Peaks`, inline: false },
                    { name: "❄️ Frozen Wastelands", value: `Endless ice fields stretch under crystal skies\nLeads to: 🏔️ Glacial Caverns`, inline: false },
                    { name: "🌿 Verdant Highlands", value: `Lush green valleys teem with vibrant life\nLeads to: 🌳 Primordial Grove`, inline: false }
                )
                .setFooter({ text: "⏰ You have 30 minutes to complete once started!" });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('quest_plains')
                        .setLabel('🌾 Wide Open Plains')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('quest_forest') 
                        .setLabel('🌲 Dark Forest')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('quest_badlands')
                        .setLabel('🔥 Crimson Badlands')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('quest_wastelands')
                        .setLabel('❄️ Frozen Wastelands')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('quest_highlands')
                        .setLabel('🌿 Verdant Highlands')
                        .setStyle(ButtonStyle.Success)
                );

            const sentMessage = await message.channel.send({ embeds: [embed], components: [row] });
            
            // Set up location selection collector
            const filter = (i) => i.user.id === userId && i.customId.startsWith('quest_');
            const collector = sentMessage.createMessageComponentCollector({ filter, time: 300000 });

            collector.on('collect', async (i) => {
                const location = i.customId.replace('quest_', '');
                await startLocationQuest(i, userId, location, activeQuests);
                collector.stop();
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await sentMessage.edit({ components: [] });
                }
            });

        } catch (error) {
            console.error('Quest command error:', error);
            message.channel.send("❌ An error occurred while starting the quest.");
        }
    }
};

async function startLocationQuest(interaction, userId, location, activeQuests) {
    try {
        await interaction.deferUpdate();
        
        // Set quest state
        activeQuests.set(userId, {
            location: location,
            startTime: Date.now(),
            questsCompleted: 0,
            totalMonsterValue: 0,
            currentQuest: null,
            data: {}
        });
        
        await db.set(`on_quest_${userId}`, true);
        
        // Start first quest
        const randomQuest = questTypeNames[Math.floor(Math.random() * questTypeNames.length)];
        const locationData = locations[location];
        
        const embed = new EmbedBuilder()
            .setTitle(`${locationData.name} - Ready to Begin`)
            .setColor("#4169E1")
            .setDescription(`You arrive at the ${locationData.name.toLowerCase()}. ${locationData.description}.\n\nA ${questTypes[randomQuest].name} awaits you!`)
            .addFields(
                { name: "Progress", value: "0/2 quests completed", inline: false },
                { name: "Quest Type", value: questTypes[randomQuest].name, inline: true }
            );

        const continueRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_first_quest')
                    .setLabel('▶️ Begin Quest')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({ embeds: [embed], components: [continueRow] });
        
        // Set up quest start collector
        const filter = (i) => i.user.id === userId && i.customId === 'start_first_quest';
        const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

        collector.on('collect', async (i) => {
            await questTypes[randomQuest].handler(i, userId, activeQuests);
            collector.stop();
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await endQuest(interaction, userId, false, "⏰ Quest timed out!", activeQuests);
            }
        });

    } catch (error) {
        console.error('Error starting location quest:', error);
        await endQuest(interaction, userId, false, "❌ An error occurred!", activeQuests);
    }
}

async function startDebugQuest(message, userId, questType) {
    try {
        if (await isOnQuest(userId)) {
            return message.channel.send("❌ You're already on a quest!");
        }

        activeQuests.set(userId, {
            location: "debug",
            startTime: Date.now(),
            questsCompleted: 0,
            totalMonsterValue: 0,
            currentQuest: questType,
            data: { isDebug: true }
        });

        await db.set(`on_quest_${userId}`, true);

        const embed = new EmbedBuilder()
            .setTitle(`🐛 DEBUG: ${questTypes[questType].name}`)
            .setColor("#FF0000")
            .setDescription("Debug quest starting...")
            .addFields({ name: "Quest Type", value: questTypes[questType].name, inline: true });

        const sentMessage = await message.channel.send({ embeds: [embed] });

        const mockInteraction = {
            user: message.author,
            message: sentMessage,
            deferUpdate: async () => {},
            editReply: async (options) => await sentMessage.edit(options),
            channel: message.channel
        };

        await questTypes[questType].handler(mockInteraction, userId, activeQuests);

    } catch (error) {
        console.error('Debug quest error:', error);
        message.channel.send("❌ Debug quest failed.");
    }
}

async function completeQuest(interaction, userId, questReward, activeQuests, customMessage = null) {
    try {
        const quest = activeQuests.get(userId);
        if (!quest) return;

        quest.questsCompleted++;
        quest.totalMonsterValue += questReward;

        if (quest.questsCompleted >= 2) {
            // Both quests completed - award final reward
            const totalReward = 250 + Math.floor(quest.totalMonsterValue * 0.5);
            await db.add(`money_${userId}`, totalReward);
            
            const message = customMessage || 
                `🎉 **QUEST COMPLETE!** You've earned ${totalReward} kopeks!\n` +
                `Base reward: 250 kopeks\nMonster bonus: ${Math.floor(quest.totalMonsterValue * 0.5)} kopeks`;
            
            await endQuest(interaction, userId, true, message, activeQuests);
        } else {
            // Start second quest
            const randomQuest = questTypeNames[Math.floor(Math.random() * questTypeNames.length)];
            const locationData = locations[quest.location];
            
            const embed = new EmbedBuilder()
                .setTitle(`${locationData.nextLocation} - Quest 2/2`)
                .setColor("#4169E1")
                .setDescription(`You journey deeper to ${locationData.nextLocation}.\n\nA ${questTypes[randomQuest].name} blocks your path!`)
                .addFields({ name: "Progress", value: "1/2 quests completed", inline: false });

            await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [] });

            setTimeout(async () => {
                const continueEmbed = new EmbedBuilder()
                    .setTitle(`${locationData.nextLocation} - Ready`)
                    .setColor("#4169E1")
                    .setDescription(`A ${questTypes[randomQuest].name} awaits!`)
                    .addFields({ name: "Progress", value: "1/2 quests completed", inline: false });

                const continueRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('start_second_quest')
                            .setLabel('▶️ Begin Second Quest')
                            .setStyle(ButtonStyle.Primary)
                    );

                await CombatSystem.updateInteractionSafely(interaction, { embeds: [continueEmbed], components: [continueRow] });

                const filter = (i) => i.user.id === userId && i.customId === 'start_second_quest';
                const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

                collector.on('collect', async (i) => {
                    await questTypes[randomQuest].handler(i, userId, activeQuests);
                    collector.stop();
                });

                collector.on('end', async (collected, reason) => {
                    if (reason === 'time') {
                        await endQuest(interaction, userId, false, "⏰ Quest timed out!", activeQuests);
                    }
                });
            }, 3000);
        }
    } catch (error) {
        console.error('Error completing quest:', error);
        await endQuest(interaction, userId, false, "❌ Quest completion failed!", activeQuests);
    }
}

async function endQuest(interaction, userId, success, message, activeQuests) {
    try {
        activeQuests.delete(userId);
        await db.delete(`on_quest_${userId}`);

        const embed = new EmbedBuilder()
            .setTitle(success ? "✅ Quest Complete!" : "❌ Quest Failed!")
            .setColor(success ? "#00FF00" : "#FF0000")
            .setDescription(message);

        await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [] });
    } catch (error) {
        console.error('Error ending quest:', error);
    }
}

async function isOnQuest(userId) {
    return activeQuests.has(userId) || await db.get(`on_quest_${userId}`);
}

module.exports.completeQuest = completeQuest;
module.exports.endQuest = endQuest;
module.exports.isOnQuest = isOnQuest;
module.exports.activeQuests = activeQuests;
