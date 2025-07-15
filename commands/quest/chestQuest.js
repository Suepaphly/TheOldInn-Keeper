const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Color options for the code
const colors = [
    { name: "Red", emoji: "🔴", id: "red" },
    { name: "Blue", emoji: "🔵", id: "blue" },
    { name: "Green", emoji: "🟢", id: "green" },
    { name: "Yellow", emoji: "🟡", id: "yellow" },
    { name: "Purple", emoji: "🟣", id: "purple" },
    { name: "Orange", emoji: "🟠", id: "orange" }
];

async function startChestQuest(interaction, userId, activeQuests) {
    const { completeQuest, endQuest } = require('../quest.js');
    const CombatSystem = require('./combatSystem.js');
    const { COMBAT_PRESETS } = CombatSystem;

    // Generate a random 4-color code
    const secretCode = [];
    for (let i = 0; i < 4; i++) {
        secretCode.push(colors[Math.floor(Math.random() * colors.length)].id);
    }

    // Store quest data
    const questData = {
        secretCode: secretCode,
        attempts: 0,
        maxAttempts: 5,
        guessHistory: [],
        currentGuess: []
    };

    const embed = new EmbedBuilder()
        .setTitle("📦 Mysterious Locked Chest")
        .setColor("#8B4513")
        .setDescription(`You discover an ancient chest sealed with a magical color lock! The chest requires a **4-color combination** to open.\n\n🎯 **Your Mission:** Crack the color code within **5 attempts**!\n\n**Available Colors:**\n🔴 Red  🔵 Blue  🟢 Green\n🟡 Yellow  🟣 Purple  🟠 Orange\n\n**How to Play:**\n• Select 4 colors in the correct order\n• After each guess, you'll get feedback:\n  ✅ = Correct color in correct position\n  🟨 = Correct color in wrong position\n  ❌ = Color not in the code`)
        .addFields(
            { name: "Attempts Remaining", value: "5/5", inline: true },
            { name: "Reward", value: "100-500 kopeks", inline: true },
            { name: "Current Guess", value: "_ _ _ _", inline: false }
        );

    const colorRow1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('chest_red')
                .setEmoji('🔴')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('chest_blue')
                .setEmoji('🔵')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('chest_green')
                .setEmoji('🟢')
                .setStyle(ButtonStyle.Success)
        );

    const colorRow2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('chest_yellow')
                .setEmoji('🟡')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('chest_purple')
                .setEmoji('🟣')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('chest_orange')
                .setEmoji('🟠')
                .setStyle(ButtonStyle.Secondary)
        );

    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('chest_clear')
                .setLabel('🗑️ Clear')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('chest_submit')
                .setLabel('🔓 Try Code')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
        );

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [colorRow1, colorRow2, actionRow] });

    const filter = (i) => i.user.id === userId && i.customId.startsWith('chest_');
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        if (i.customId === 'chest_clear') {
            questData.currentGuess = [];
        } else if (i.customId === 'chest_submit') {
            if (questData.currentGuess.length === 4) {
                await handleGuessSubmission(i, questData, userId, activeQuests, collector);
                return;
            }
        } else {
            const colorId = i.customId.replace('chest_', '');
            if (questData.currentGuess.length < 4) {
                questData.currentGuess.push(colorId);
            }
        }

        await updateChestDisplay(i, questData);
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await endQuest(interaction, userId, false, "⏰ You took too long to crack the chest's code! The chest vanishes into thin air.", activeQuests);
        }
    });

    // Store quest data in memory for this interaction
    interaction.chestData = questData;
}

async function handleGuessSubmission(interaction, questData, userId, activeQuests, collector) {
    const { completeQuest, endQuest } = require('../quest.js');
    const CombatSystem = require('./combatSystem.js');
    const { COMBAT_PRESETS } = CombatSystem;

    questData.attempts++;
    const guess = [...questData.currentGuess];
    const feedback = generateFeedback(guess, questData.secretCode);

    // Add to history
    questData.guessHistory.push({
        guess: guess,
        feedback: feedback
    });

    // Reset current guess
    questData.currentGuess = [];

    // Check if player won
    if (feedback.every(f => f === '✅')) {
        // Success! Check for mimic (25% chance)
        const isMimic = Math.random() < 0.25;

        if (isMimic) {
            // Store the reward for after mimic defeat
            interaction.chestReward = Math.floor(Math.random() * 401) + 100; // 100-500 kopeks
            await startMimicEncounter(interaction, userId, activeQuests);
            collector.stop();
            return;
        }

        // No mimic - normal chest reward
        const reward = Math.floor(Math.random() * 401) + 100; // 100-500 kopeks
        await db.add(`money_${userId}`, reward);

        let successMessage = `🎉 **CHEST UNLOCKED!** 🎉\n\nYou cracked the code in ${questData.attempts} attempt${questData.attempts === 1 ? '' : 's'}! The chest creaks open, revealing **${reward} kopeks** inside!`;

        if (questData.attempts === 1) {
            successMessage += "\n\n🏆 **Perfect!** You solved it on the first try!";
        }

        await completeQuest(interaction, userId, activeQuests, successMessage);
        collector.stop();
        return;
    }

    // Check if player failed
    if (questData.attempts >= questData.maxAttempts) {
        const secretEmojis = questData.secretCode.map(colorId => 
            colors.find(c => c.id === colorId).emoji
        ).join(' ');

        await endQuest(interaction, userId, false, `💀 **CHEST REMAINS SEALED!**\n\nYou've used all 5 attempts! The chest's magic grows stronger and it disappears forever.\n\n🔑 The correct code was: ${secretEmojis}`, activeQuests);
        collector.stop();
        return;
    }

    // Continue game
    await updateChestDisplay(interaction, questData);
}

function generateFeedback(guess, secretCode) {
    const feedback = ['❌', '❌', '❌', '❌'];
    const secretCopy = [...secretCode];
    const guessCopy = [...guess];

    // First pass: check for exact matches
    for (let i = 0; i < 4; i++) {
        if (guess[i] === secretCode[i]) {
            feedback[i] = '✅';
            secretCopy[i] = null;
            guessCopy[i] = null;
        }
    }

    // Second pass: check for color matches in wrong positions
    for (let i = 0; i < 4; i++) {
        if (guessCopy[i] !== null) {
            const index = secretCopy.indexOf(guessCopy[i]);
            if (index !== -1) {
                feedback[i] = '🟨';
                secretCopy[index] = null;
            }
        }
    }

    return feedback;
}

async function updateChestDisplay(interaction, questData) {
    const CombatSystem = require('./combatSystem.js');
    const { COMBAT_PRESETS } = CombatSystem;

    const currentGuessDisplay = questData.currentGuess.map(colorId => 
        colors.find(c => c.id === colorId).emoji
    ).join(' ') + ' '.repeat(Math.max(0, (4 - questData.currentGuess.length) * 2 - 1)) + 
    '_ '.repeat(4 - questData.currentGuess.length).trim();

    const historyText = questData.guessHistory.map((entry, index) => {
        const guessEmojis = entry.guess.map(colorId => 
            colors.find(c => c.id === colorId).emoji
        ).join(' ');
        const feedbackStr = entry.feedback.join(' ');
        return `**${index + 1}.** ${guessEmojis} → ${feedbackStr}`;
    }).join('\n') || 'No attempts yet';

    const embed = new EmbedBuilder()
        .setTitle("📦 Mysterious Locked Chest")
        .setColor("#8B4513")
        .setDescription(`🎯 **Crack the 4-color code to unlock the chest!**\n\n**Feedback Legend:**\n✅ = Correct color, correct position\n🟨 = Correct color, wrong position\n❌ = Color not in code`)
        .addFields(
            { name: "Attempts Remaining", value: `${questData.maxAttempts - questData.attempts}/5`, inline: true },
            { name: "Reward", value: "100-500 kopeks", inline: true },
            { name: "Current Guess", value: currentGuessDisplay || "_ _ _ _", inline: false },
            { name: "Previous Attempts", value: historyText, inline: false }
        );

    const colorRow1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('chest_red')
                .setEmoji('🔴')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('chest_blue')
                .setEmoji('🔵')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('chest_green')
                .setEmoji('🟢')
                .setStyle(ButtonStyle.Success)
        );

    const colorRow2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('chest_yellow')
                .setEmoji('🟡')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('chest_purple')
                .setEmoji('🟣')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('chest_orange')
                .setEmoji('🟠')
                .setStyle(ButtonStyle.Secondary)
        );

    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('chest_clear')
                .setLabel('🗑️ Clear')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('chest_submit')
                .setLabel('🔓 Try Code')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(questData.currentGuess.length !== 4)
        );

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [colorRow1, colorRow2, actionRow] });
}

async function startMimicEncounter(interaction, userId, activeQuests) {
    const CombatSystem = require('./combatSystem.js');
    const { COMBAT_PRESETS } = CombatSystem;
    const { completeQuest, endQuest } = require('../quest.js');

    const mimicData = {
        name: "Chest Mimic",
        health: 25,
        maxHealth: 25,
        damage: 6, // Average of 4-8
        defense: 0,
        value: 0
    };

    // Create combat instance
    const combat = CombatSystem.create(userId, 'mimic');
    await combat.initializeCombat({}, mimicData);

    const embed = new EmbedBuilder()
        .setTitle("🧰 MIMIC ENCOUNTER!")
        .setColor("#8B4513")
        .setDescription(`As you approach the chest, it suddenly sprouts teeth and tentacles! This is no ordinary chest - it's a **Chest Mimic**!\n\n*The mimic's tongue lashes out menacingly, dripping with acidic saliva that could dissolve your belongings!*\n\n⚠️ **Warning:** The mimic's lick attack can destroy items in your backpack!`)
        .addFields(
            { name: "Mimic Health", value: "25/25 HP", inline: true },
            { name: "Special Attack", value: "Acidic Lick (30% item destruction chance)", inline: true },
            { name: "Reward if Defeated", value: "Original chest contents", inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('mimic_attack')
                .setLabel('⚔️ Attack Mimic')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('mimic_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    // Reply to the interaction first if not already replied
    try {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [row] });
        } else {
            await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
        }
    } catch (error) {
        console.error('Error in chest quest interaction:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    // Set up combat collector
    const filter = (i) => i.user.id === userId;

    let message;
    try {
        if (interaction.replied || interaction.deferred) {
            message = await interaction.fetchReply();
        } else {
            message = interaction.message;
        }
    } catch (error) {
        console.error('Error getting message for mimic combat collector:', error);
        return;
    }

    const collector = message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        if (i.customId === 'mimic_run') {
            await endQuest(i, userId, false, "You fled from the mimic! Your quest ends in cowardly retreat.", activeQuests);
            collector.stop();
            return;
        }

        if (i.customId === 'mimic_attack') {
            await handleMimicCombat(i, userId, combat, collector, activeQuests);
        }
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await endQuest(interaction, userId, false, "⏰ You took too long to decide! The mimic grows bored and disappears.", activeQuests);
        }
    });
}

async function handleMimicCombat(interaction, userId, combat, collector, activeQuests) {
    const { completeQuest, endQuest } = require('../quest.js');
    const CombatSystem = require('./combatSystem.js');
    const { COMBAT_PRESETS } = CombatSystem;
    const { QuickDB } = require("quick.db");
    const db = new QuickDB();

    try {
        const combatResult = await combat.processCombatRound();
        let battleText = combatResult.battleText;

        // Add mimic's special lick attack effect
        if (combatResult.result === 'continue' || combatResult.result === 'defeat') {
            // 30% chance for lick attack to destroy an item
            if (Math.random() < 0.30) {
                const destroyedItem = await removeRandomBackpackItem(userId);
                if (destroyedItem) {
                    battleText += `\n💀 **The mimic's acidic lick dissolves your ${destroyedItem}!**`;
                } else {
                    battleText += `\n🛡️ The mimic's lick attack finds no items to destroy.`;
                }
            }
        }

        if (combatResult.result === 'victory') {
            // Mimic defeated - give the chest reward that was earned by solving the puzzle
            const reward = interaction.chestReward || Math.floor(Math.random() * 401) + 100; // 100-500 kopeks
            await db.add(`money_${userId}`, reward);

            const successMessage = `🎉 **MIMIC DEFEATED!** 🎉\n\nYou've slain the chest mimic! As it dissolves, it reveals the original chest contents: **${reward} kopeks**!\n\n⚔️ Your combat prowess has earned you a well-deserved reward!`;

            await completeQuest(interaction, userId, activeQuests, successMessage);
            collector.stop();
            return;
        } else if (combatResult.result === 'defeat') {
            await endQuest(interaction, userId, false, "💀 **DEVOURED BY THE MIMIC!**\n\nThe chest mimic's powerful jaws crush you! Your quest ends in a gruesome defeat.", activeQuests);
            collector.stop();
            return;
        }

        // Update combat display
        const { embed, row } = combat.createCombatEmbed(battleText);
        // Reply to the interaction first if not already replied
    try {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [row] });
        } else {
            await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
        }
    } catch (error) {
        console.error('Error in chest quest interaction:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    } catch (error) {
        console.error('Error in mimic combat:', error);
        await endQuest(interaction, userId, false, "An error occurred during the mimic encounter.", activeQuests);
        collector.stop();
    }
}

async function removeRandomBackpackItem(userId) {
    const { QuickDB } = require("quick.db");
    const db = new QuickDB();

    // Get all user items
    const allItems = await db.all();
    const userItems = [];

    // Collect weapons
    const weapons = ['knife', 'sword', 'pistol', 'shotgun', 'rifle'];
    for (const weapon of weapons) {
        const count = await db.get(`weapon_${weapon}_${userId}`) || 0;
        if (count > 0) {
            userItems.push({ type: 'weapon', name: weapon, key: `weapon_${weapon}_${userId}` });
        }
    }

    // Collect armor (excluding dragonscale)
    const armors = ['cloth', 'leather', 'chainmail', 'studded', 'plate'];
    for (const armor of armors) {
        const count = await db.get(`armor_${armor}_${userId}`) || 0;
        if (count > 0) {
            userItems.push({ type: 'armor', name: armor, key: `armor_${armor}_${userId}` });
        }
    }

    // Don't collect crystals - they are protected from destruction

    if (userItems.length === 0) {
        return null; // No items to destroy
    }

    // Select random item and remove one
    const randomItem = userItems[Math.floor(Math.random() * userItems.length)];
    await db.sub(randomItem.key, 1);

    // Return friendly name
    const friendlyNames = {
        weapon: {
            knife: 'Knife',
            sword: 'Sword', 
            pistol: 'Pistol',
            shotgun: 'Shotgun',
            rifle: 'Rifle'
        },
        armor: {
            cloth: 'Cloth Armor',
            leather: 'Leather Armor',
            chainmail: 'Chainmail Armor',
            studded: 'Studded Armor',
            plate: 'Plate Armor',
            dragonscale: 'Dragonscale Armor'
        },
        crystal: {
            white: 'White Crystal',
            black: 'Black Crystal',
            red: 'Red Crystal',
            blue: 'Blue Crystal',
            green: 'Green Crystal'
        }
    };

    return friendlyNames[randomItem.type][randomItem.name] || randomItem.name;
}

module.exports = {
    startChestQuest
};