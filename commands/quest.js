const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Import quest modules
const { startMonsterQuest } = require('./quest/monsterQuest.js');
const { startRiddleQuest } = require('./quest/riddleQuest.js');
const { startMazeQuest } = require('./quest/mazeQuest.js');
const { startTrolleyQuest } = require('./quest/trolleyQuest.js');
const { CombatSystem } = require('./quest/combatSystem.js');

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
                .setDescription("**Owner-only debug commands for testing individual quest types**\n\n**Available Quest Names:**\n• `monster` - Combat quest with 2 monsters\n• `riddle` - Ancient riddle solving quest\n• `maze` - Hedge maze navigation quest\n• `trolley` - Moral dilemma trolley problem\n• `dragon` - Choose and fight any boss dragon")
                .addFields(
                    { name: "Usage", value: "`=quest debug <questname>`", inline: false },
                    { name: "Quest Details", value: "🗡️ **monster** - Fight Goblin Scout → Orc Raider\n🧩 **riddle** - Solve 2 random riddles (death on failure)\n🌿 **maze** - Navigate 2-stage maze with traps/combat\n🚃 **trolley** - Face moral choices with vengeance risk\n🐲 **dragon** - Select any dragon to fight immediately", inline: false },
                    { name: "Debug Features", value: "• Complete after 1 quest instead of 2\n• 30-minute timeout still applies\n• No real rewards given", inline: false }
                );

            return message.channel.send({ embeds: [debugEmbed] });
        }

        const questType = args[1].toLowerCase();
        if (!questTypes[questType] && questType !== 'dragon') {
            return message.channel.send("❌ Invalid quest type! Available: monster, riddle, maze, trolley, dragon");
        }

        // Handle dragon debug separately
        if (questType === 'dragon') {
            await startDragonDebugQuest(message, userId);
            return;
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

    const questMessage = await message.channel.send({ 
        embeds: [embed], 
        components: [row1, row2] 
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

    // Track daily quest completions for dragon spawning
    const today = new Date().toDateString();
    const dailyKey = `daily_quests_${userId}_${today}`;
    const dailyQuests = await db.get(dailyKey) || 0;
    await db.set(dailyKey, dailyQuests + 1);

    // Check for boss dragon spawn (50% chance after first quest of the day)
    const shouldSpawnDragon = dailyQuests >= 1 && Math.random() < 0.5;

    if (quest.questsCompleted >= 2) {
        // Check if user has all 5 crystals for Tiamat encounter
        const { getCrystals } = require('../utility/crystalUtils.js');
        const crystals = await getCrystals(userId);
        const hasAllCrystals = crystals.white > 0 && crystals.black > 0 && crystals.red > 0 && crystals.blue > 0 && crystals.green > 0;

        if (hasAllCrystals) {
            // Check if Tiamat is on cooldown before attempting to spawn
            const tiamatCooldown = await db.get(`tiamat_cooldown_${userId}`);
            if (tiamatCooldown && Date.now() < tiamatCooldown) {
                // Tiamat is on cooldown, complete quest normally with special message
                let totalReward = 250;
                let rewardText = "You have completed both quests and earned 250 kopeks!";

                if (quest.totalMonsterValue > 0) {
                    const monsterBonus = Math.floor(quest.totalMonsterValue / 2);
                    totalReward += monsterBonus;
                    rewardText = `You have completed both quests and earned 250 kopeks + ${monsterBonus} kopeks bonus from slaying monsters (total: ${totalReward} kopeks)!`;
                }

                const timeRemaining = tiamatCooldown - Date.now();
                const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));
                rewardText += `\n\n🐲 **Tiamat's Presence Detected!** You possess all 5 crystals, but Tiamat is still recovering from your previous battle. She can only be challenged once per day. Time remaining: ${hoursRemaining} hours`;

                if (trolleyMessage) {
                    rewardText = `${trolleyMessage}\n\n${rewardText}`;
                }

                await db.add(`money_${userId}`, totalReward);
                await endQuest(interaction, userId, true, rewardText, activeQuests);
                return;
            } else {
                // Spawn Tiamat instead of completing normally
                await spawnTiamat(interaction, userId, activeQuests);
                return;
            }
        }

        if (shouldSpawnDragon) {
            // Spawn boss dragon instead of completing normally
            await spawnBossDragon(interaction, userId, quest.location, activeQuests);
            return;
        }
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

// Dragon data for each location
const dragonData = {
    plains: {
        name: "Ancient White Dragon",
        color: "white",
        crystal: "White Crystal",
        specialMove: "Tax",
        specialDescription: "steals 10% of your coins"
    },
    forest: {
        name: "Ancient Black Dragon",
        color: "black", 
        crystal: "Black Crystal",
        specialMove: "Death",
        specialDescription: "has a 10% chance to instantly kill you"
    },
    redlands: {
        name: "Ancient Red Dragon",
        color: "red",
        crystal: "Red Crystal", 
        specialMove: "Melt",
        specialDescription: "destroys a random item in your backpack"
    },
    frostlands: {
        name: "Ancient Blue Dragon",
        color: "blue",
        crystal: "Blue Crystal",
        specialMove: "Freeze", 
        specialDescription: "you skip your next turn"
    },
    emeraldlands: {
        name: "Ancient Green Dragon",
        color: "green",
        crystal: "Green Crystal",
        specialMove: "Heal",
        specialDescription: "heals the dragon for 2-8 health"
    }
};

async function spawnBossDragon(interaction, userId, location, activeQuests) {
    const dragon = dragonData[location];
    const { startDragonBattle } = require('./quest/dragonBattle.js');

    const embed = new EmbedBuilder()
        .setTitle("🐲 BOSS DRAGON APPEARS!")
        .setColor("#8B0000")
        .setDescription(`As you complete your quest, the ground trembles! An **${dragon.name}** emerges from the depths!\n\n*"You dare trespass in my domain, mortal?"*\n\nThe ancient beast roars, ready for battle!`)
        .addFields(
            { name: "Dragon", value: dragon.name, inline: true },
            { name: "Special Ability", value: `${dragon.specialMove} - ${dragon.specialDescription}`, inline: true },
            { name: "Reward", value: `${dragon.crystal} (if victorious)`, inline: true }
        );

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [] });

    // Start dragon battle after a delay
    setTimeout(async () => {
        await startDragonBattle(interaction, userId, location, activeQuests);
    }, 3000);
}

async function spawnTiamat(interaction, userId, activeQuests) {
    const { startTiamatBattle } = require('./quest/dragonBattle.js'); // Use dragonBattle.js which contains Tiamat code

    const embed = new EmbedBuilder()
        .setTitle("🐲 TIAMAT, MOTHER OF DRAGONS, APPEARS!")
        .setColor("#8B0000")
        .setDescription(`The earth SHAKES as **TIAMAT**, the five-headed dragon goddess, descends from the heavens! She has come to reclaim the crystals you possess!\n\n*"Foolish mortal, you have collected what is rightfully mine! Prepare to face my wrath!"*`)
        .addFields(
            { name: "Reward", value: "The right to keep the crystals (if victorious)", inline: false }
        );

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [] });

    // Start Tiamat battle after a delay
    setTimeout(async () => {
        await startTiamatBattle(interaction, userId, activeQuests);
    }, 3000);
}

// Function to check if user is on quest (for use in other commands)
async function isOnQuest(userId) {
    return activeQuests.has(userId) || await db.get(`on_quest_${userId}`);
}

async function startDragonDebugQuest(message, userId) {
    // Check if user is already on a quest
    if (activeQuests.has(userId)) {
        return message.channel.send("❌ You are already on a quest! Complete it first before starting another.");
    }

    // Check if user is dead
    const deathTimer = await db.get(`death_cooldown_${userId}`);
    if (deathTimer && Date.now() - deathTimer < 86400000) { // 24 hours
        return message.channel.send("💀 You cannot go on quests while dead! Use `=revive` first.");
    }

    const embed = new EmbedBuilder()
        .setTitle("🐲 DEBUG DRAGON SELECTION")
        .setColor("#8B0000")
        .setDescription("**Owner-only debug mode for testing dragon battles**\n\nChoose which ancient dragon you want to fight:")
        .addFields(
            { name: "🌾 White Dragon", value: "**Tax** - Steals 10% of your coins\n*Location: Plains*", inline: true },
            { name: "🌲 Black Dragon", value: "**Death** - 10% chance to instantly kill\n*Location: Forest*", inline: true },
            { name: "🔥 Red Dragon", value: "**Melt** - Destroys random backpack item\n*Location: Badlands*", inline: true },
            { name: "❄️ Blue Dragon", value: "**Freeze** - Skip your next turn\n*Location: Wastelands*", inline: true },
            { name: "🌿 Green Dragon", value: "**Heal** - Heals dragon for 2-8 health\n*Location: Highlands*", inline: true },
            { name: "\u200B", value: "\u200B", inline: true }
        )
        .setFooter({ text: "🔧 Debug Mode - No real rewards will be given" });

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('debug_dragon_plains')
                .setLabel('🌾 White Dragon')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('debug_dragon_forest')
                .setLabel('🌲 Black Dragon')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('debug_dragon_redlands')
                .setLabel('🔥 Red Dragon')
                .setStyle(ButtonStyle.Danger)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('debug_dragon_frostlands')
                .setLabel('❄️ Blue Dragon')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('debug_dragon_emeraldlands')
                .setLabel('🌿 Green Dragon')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('debug_dragon_cancel')
                .setLabel('❌ Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    const dragonMessage = await message.channel.send({ 
        embeds: [embed], 
        components: [row1, row2] 
    });

    // Set up collector for dragon selection
    const filter = (interaction) => {
        return interaction.user.id === message.author.id;
    };

    const collector = dragonMessage.createMessageComponentCollector({
        filter,
        time: 60000 // 1 minute to choose
    });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'debug_dragon_cancel') {
            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setTitle("❌ Dragon Debug Cancelled")
                    .setColor("#FF0000")
                    .setDescription("Dragon debug mode cancelled.")],
                components: []
            });
            collector.stop();
            return;
        }

        // Extract dragon location from customId
        const location = interaction.customId.replace('debug_dragon_', '');
        const dragon = dragonData[location];

        // Mark user as on debug quest
        const questData = {
            location: location,
            startTime: Date.now(),
            questsCompleted: 2, // Set to 2 so dragon spawns immediately
            totalMonsterValue: 0,
            currentQuest: 'dragon',
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
                    .setTitle("⏰ Dragon Debug Timeout")
                    .setColor("#FF0000")
                    .setDescription("Your dragon debug quest has timed out after 30 minutes.");

                try {
                    await interaction.followUp({ embeds: [timeoutEmbed] });
                } catch (err) {
                    console.log("Failed to send timeout message:", err);
                }
            }
        }, 1800000); // 30 minutes

        // Show dragon intro
        const introEmbed = new EmbedBuilder()
            .setTitle(`🐲 DEBUG DRAGON BATTLE - ${dragon.name}`)
            .setColor("#8B0000")
            .setDescription(`**Debug Mode Activated**\n\nThe ground trembles as an **${dragon.name}** emerges from the depths!\n\n*"You dare challenge me in debug mode, mortal?"*\n\nPreparing for battle...`)
            .addFields(
                { name: "Dragon", value: dragon.name, inline: true },
                { name: "Special Ability", value: `${dragon.specialMove} - ${dragon.specialDescription}`, inline: true },
                { name: "Debug Reward", value: `${dragon.crystal} (debug - won't be kept)`, inline: true }
            );

        await interaction.update({ embeds: [introEmbed], components: [] });

        // Start dragon battle after delay
        setTimeout(async () => {
            const { startDragonBattle } = require('./quest/dragonBattle.js');
            await startDragonBattle(interaction, userId, location, activeQuests);
        }, 3000);

        collector.stop();
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && !collected.size) {
            dragonMessage.edit({
                embeds: [new EmbedBuilder()
                    .setTitle("⏰ Dragon Selection Timeout")
                    .setColor("#FF0000")
                    .setDescription("You took too long to choose a dragon.")],
                components: []
            });
        }
    });
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

    const debugMessage = awaitmessage.channel.send({ embeds: [embed] });

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