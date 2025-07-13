const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { CombatSystem, COMBAT_PRESETS } = require('./combatSystem.js');

// Riddle data
const riddles = [
    {
        question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
        answer: "map",
        alternatives: ["a map"]
    },
    {
        question: "The more you take, the more you leave behind. What am I?",
        answer: "footsteps",
        alternatives: ["steps"]
    },
    {
        question: "I am not alive, but I grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?",
        answer: "fire",
        alternatives: []
    },
    {
        question: "What has keys but no locks, space but no room, and you can enter but not go inside?",
        answer: "keyboard",
        alternatives: ["a keyboard"]
    },
    {
        question: "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?",
        answer: "echo",
        alternatives: ["an echo"]
    },
    {
        question: "What gets wet while drying?",
        answer: "towel",
        alternatives: ["a towel"]
    },
    {
        question: "I have a head and a tail, but no body. What am I?",
        answer: "coin",
        alternatives: ["a coin"]
    },
    {
        question: "The more you take away from me, the bigger I become. What am I?",
        answer: "hole",
        alternatives: ["a hole"]
    }
];

async function startRiddleQuest(interaction, userId, activeQuests) {
    const quest = activeQuests.get(userId);

    quest.data = {
        currentRiddle: 1,
        maxRiddles: 2,
        riddlesCompleted: 0
    };

    await presentRiddle(interaction, userId, activeQuests, 1);
}

async function presentRiddle(interaction, userId, activeQuests, riddleNumber) {
    const quest = activeQuests.get(userId);
    const riddle = riddles[Math.floor(Math.random() * riddles.length)];

    quest.data.currentRiddleData = riddle;

    const embed = new EmbedBuilder()
        .setTitle(`🧩 ANCIENT RIDDLE ${riddleNumber}/2`)
        .setColor("#4B0082")
        .setDescription(`An ancient sphinx appears before you and speaks:\n\n*"${riddle.question}"*\n\n**Answer correctly or face death!**`)
        .addFields(
            { name: "Instructions", value: "Type your answer in chat within 60 seconds!", inline: false },
            { name: "Progress", value: `${quest.data.riddlesCompleted}/2 riddles solved`, inline: false }
        );

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [] });

    // Set up message collector for answer
    const filter = (message) => message.author.id === userId;
    const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', async (message) => {
        const answer = message.content.toLowerCase().trim();
        const correctAnswers = [riddle.answer, ...riddle.alternatives];

        if (correctAnswers.includes(answer)) {
            // Correct answer
            quest.data.riddlesCompleted++;

            if (quest.data.riddlesCompleted >= 2) {
                // Both riddles completed
                const { completeQuest } = require('../quest.js');
                await completeQuest(interaction, userId, activeQuests, "🧩 You have solved both ancient riddles! The sphinx nods approvingly and vanishes.");
            } else {
                // Move to next riddle - update the same message
                const successEmbed = new EmbedBuilder()
                    .setTitle("✅ Riddle Solved!")
                    .setColor("#00FF00")
                    .setDescription(`Correct! The sphinx nods approvingly.\n\nPreparing the next riddle...`)
                    .addFields(
                        { name: "Progress", value: `${quest.data.riddlesCompleted}/2 riddles solved`, inline: false }
                    );

                await CombatSystem.updateInteractionSafely(interaction, { embeds: [successEmbed], components: [] });

                setTimeout(async () => {
                    await presentRiddle(interaction, userId, activeQuests, 2);
                }, 3000);
            }
        } else {
            // Wrong answer - death by sphinx
            const deathMessage = "The ancient sphinx devours you for your ignorance!";

            // Set death timer
            await db.set(`death_cooldown_${userId}`, Date.now());

            const { endQuest } = require('../quest.js');
            await endQuest(interaction, userId, false, deathMessage, activeQuests);
        }
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
            // Timeout - death by sphinx
            const deathMessage = "You took too long to answer! The ancient sphinx devours you for your hesitation!";

            // Set death timer
            await db.set(`death_cooldown_${userId}`, Date.now());

            const { endQuest } = require('../quest.js');
            await endQuest(interaction, userId, false, deathMessage, activeQuests);
        }
    });
}

module.exports = {
    startRiddleQuest
};