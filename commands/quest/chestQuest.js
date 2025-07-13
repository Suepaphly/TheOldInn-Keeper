
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

    await interaction.update({ embeds: [embed], components: [colorRow1, colorRow2, actionRow] });

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
        // Success! Generate reward
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

    await interaction.update({ embeds: [embed], components: [colorRow1, colorRow2, actionRow] });
}

module.exports = {
    startChestQuest
};
