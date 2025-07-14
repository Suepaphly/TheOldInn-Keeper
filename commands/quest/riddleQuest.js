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
    },
    {
        question: "What can travel around the world while staying in a corner?",
        answer: "stamp",
        alternatives: ["a stamp", "postage stamp"]
    },
    {
        question: "I have branches, but no fruit, trunk, or leaves. What am I?",
        answer: "bank",
        alternatives: ["a bank"]
    },
    {
        question: "What breaks but never falls, and what falls but never breaks?",
        answer: "day and night",
        alternatives: ["dawn and dusk", "day breaks and night falls"]
    },
    {
        question: "I'm tall when I'm young, and short when I'm old. What am I?",
        answer: "candle",
        alternatives: ["a candle"]
    },
    {
        question: "What has one eye but cannot see?",
        answer: "needle",
        alternatives: ["a needle"]
    },
    {
        question: "What runs but never walks, has a mouth but never talks, has a bed but never sleeps?",
        answer: "river",
        alternatives: ["a river"]
    },
    {
        question: "I am always hungry and will die if not fed, but whatever I touch will soon turn red. What am I?",
        answer: "fire",
        alternatives: []
    },
    {
        question: "What has hands but cannot clap?",
        answer: "clock",
        alternatives: ["a clock"]
    },
    {
        question: "I am light as a feather, yet the strongest person can't hold me for much longer than a minute. What am I?",
        answer: "breath",
        alternatives: ["your breath"]
    },
    {
        question: "What has a neck but no head?",
        answer: "bottle",
        alternatives: ["a bottle"]
    },
    {
        question: "I can be cracked, I can be made, I can be told, I can be played. What am I?",
        answer: "joke",
        alternatives: ["a joke"]
    },
    {
        question: "What goes up but never comes down?",
        answer: "age",
        alternatives: ["your age"]
    },
    {
        question: "I have teeth but cannot bite. What am I?",
        answer: "comb",
        alternatives: ["a comb", "zipper", "a zipper", "gear", "a gear"]
    },
    {
        question: "What can you catch but not throw?",
        answer: "cold",
        alternatives: ["a cold", "flu", "the flu"]
    },
    {
        question: "I'm found in socks, scarves, and mittens; and often in the paws of playful kittens. What am I?",
        answer: "yarn",
        alternatives: ["wool"]
    },
    {
        question: "What has a bottom at the top?",
        answer: "legs",
        alternatives: ["your legs", "leg"]
    },
    {
        question: "I am taken from a mine and shut up in a wooden case, from which I am never released, yet I am used by almost everyone. What am I?",
        answer: "pencil lead",
        alternatives: ["lead", "graphite"]
    },
    {
        question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
        answer: "m",
        alternatives: ["the letter m"]
    },
    {
        question: "Forward I am heavy, but backward I am not. What am I?",
        answer: "ton",
        alternatives: ["the word ton"]
    },
    {
        question: "What building has the most stories?",
        answer: "library",
        alternatives: ["a library"]
    },
    {
        question: "What gets sharper the more you use it?",
        answer: "brain",
        alternatives: ["your brain", "mind", "your mind"]
    },
    {
        question: "I am always in front of you but can't be seen. What am I?",
        answer: "future",
        alternatives: ["the future"]
    },
    {
        question: "What has many teeth but cannot bite?",
        answer: "saw",
        alternatives: ["a saw"]
    },
    {
        question: "I can fly without wings, cry without eyes. Wherever I go, darkness flies. What am I?",
        answer: "cloud",
        alternatives: ["clouds", "a cloud"]
    },
    {
        question: "What disappears as soon as you say its name?",
        answer: "silence",
        alternatives: []
    },
    {
        question: "The more of this there is, the less you see. What is it?",
        answer: "darkness",
        alternatives: ["dark"]
    },
    {
        question: "What starts with T, ends with T, and has T in it?",
        answer: "teapot",
        alternatives: ["a teapot"]
    },
    {
        question: "I have no life, but I can die. What am I?",
        answer: "battery",
        alternatives: ["a battery"]
    },
    {
        question: "What word becomes shorter when you add two letters to it?",
        answer: "short",
        alternatives: ["the word short"]
    },
    {
        question: "I am taken before you can get me. What am I?",
        answer: "picture",
        alternatives: ["a picture", "photo", "a photo"]
    },
    {
        question: "What has four fingers and a thumb but is not alive?",
        answer: "glove",
        alternatives: ["a glove"]
    },
    {
        question: "I have a golden head and a golden tail, but no body. What am I?",
        answer: "coin",
        alternatives: ["a coin", "penny", "a penny"]
    },
    {
        question: "What can you hold in your right hand but never in your left hand?",
        answer: "left hand",
        alternatives: ["your left hand"]
    },
    {
        question: "I am full of holes but still hold water. What am I?",
        answer: "sponge",
        alternatives: ["a sponge"]
    },
    {
        question: "What goes through cities and fields but never moves?",
        answer: "road",
        alternatives: ["a road", "roads"]
    },
    {
        question: "I have one foot but cannot walk. What am I?",
        answer: "ruler",
        alternatives: ["a ruler", "measuring stick"]
    },
    {
        question: "What has words but never speaks?",
        answer: "book",
        alternatives: ["a book"]
    },
    {
        question: "I am always coming but never arrive. What am I?",
        answer: "tomorrow",
        alternatives: []
    },
    {
        question: "What can you serve but never eat?",
        answer: "tennis ball",
        alternatives: ["ball", "a ball", "volleyball", "a tennis ball"]
    },
    {
        question: "I get smaller every time I take a bath. What am I?",
        answer: "soap",
        alternatives: ["a soap", "bar of soap"]
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
        try {
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
                // Wrong answer - check for blue crystal protection
                const { hasCrystal } = require('../../utility/crystalUtils.js');
                const hasBlueCrystal = await hasCrystal(userId, 'blue');

                if (hasBlueCrystal) {
                    // Start sphinx combat
                    quest.data.sphinxCombat = true;
                    await startSphinxCombat(interaction, userId, collector, activeQuests);
                } else {
                    // Death
                    const { endQuest } = require('../quest.js');
                    await db.set(`death_cooldown_${userId}`, Date.now());
                    await endQuest(interaction, userId, false, "The sphinx roars with anger and devours you whole. You are now dead for 24 hours.", activeQuests);
                    collector.stop();
                }
            }
        } catch (error) {
            console.error('Error in riddle quest collector:', error);
            const { endQuest } = require('../quest.js');
            await endQuest(interaction, userId, false, "An error occurred during the riddle. Your quest ends.", activeQuests);
            collector.stop();
        }
    });

    collector.on('end', async (collected, reason) => {
        try {
            if (reason === 'time' && collected.size === 0) {
                // Timeout - check for blue crystal protection
                const { hasCrystal } = require('../../utility/crystalUtils.js');
                const hasBlueCrystal = await hasCrystal(userId, 'blue');

                if (hasBlueCrystal) {
                    // Start sphinx combat
                    quest.data.sphinxCombat = true;
                    await startSphinxCombat(interaction, userId, collector, activeQuests);
                } else {
                    // Death
                    const { endQuest } = require('../quest.js');
                    await db.set(`death_cooldown_${userId}`, Date.now());
                    await endQuest(interaction, userId, false, "The sphinx roars with anger and devours you whole. You are now dead for 24 hours.", activeQuests);
                    collector.stop();
                }
            }
        } catch (error) {
            console.error('Error in riddle quest collector:', error);
            const { endQuest } = require('../quest.js');
            await endQuest(interaction, userId, false, "An error occurred during the riddle. Your quest ends.", activeQuests);
            collector.stop();
        }
    });
}

async function startSphinxCombat(interaction, userId, collector, activeQuests) {
    // Stop the parent collector to prevent interference
    collector.stop();

    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;

    // Create sphinx enemy
    const sphinxData = {
        name: "Ancient Sphinx",
        health: 50,
        maxHealth: 50,
        damage: 10,
        defense: 2,
        value: 0
    };

    // Create combat instance
    const combat = CombatSystem.create(userId, 'riddle');
    await combat.initializeCombat({}, sphinxData);

    // Store combat instance in quest data
    quest.data.combat = combat;

    const { embed, row } = combat.createCombatEmbed("The sphinx attacks you with its deadly bite!");
    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

    // Set up sphinx combat collector
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
        console.error('Error getting message for sphinx combat collector:', error);
        return;
    }

    const combatCollector = message.createMessageComponentCollector({ filter, time: 1800000 });

    combatCollector.on('collect', async (i) => {
        if (i.customId === 'riddle_run') {
            const { endQuest } = require('../quest.js');
            await endQuest(i, userId, false, "You fled from the sphinx! Your quest ends in cowardly retreat.", activeQuests);
            combatCollector.stop();
            return;
        }

        if (i.customId === 'riddle_attack') {
            try {
                const combatResult = await quest.data.combat.processCombatRound();

                if (combatResult.result === 'victory') {
                    // Victory - complete the quest successfully
                    const { completeQuest } = require('../quest.js');
                    await completeQuest(i, userId, activeQuests, `${combatResult.battleText}\n\nYou have defeated the ancient sphinx! The guardian of riddles falls before your might. Your quest ends in glorious victory!`);
                    combatCollector.stop();
                } else if (combatResult.result === 'defeat') {
                    const { endQuest } = require('../quest.js');
                    await endQuest(i, userId, false, await quest.data.combat.handleDefeat(), activeQuests);
                    combatCollector.stop();
                } else {
                    // Combat continues
                    const { embed, row } = quest.data.combat.createCombatEmbed(combatResult.battleText);
                    await CombatSystem.updateInteractionSafely(i, { embeds: [embed], components: [row] });
                }
            } catch (error) {
                console.error('Error in sphinx combat:', error);
                const { endQuest } = require('../quest.js');
                await endQuest(i, userId, false, "An error occurred during combat. Your quest ends.", activeQuests);
                combatCollector.stop();
            }
        }
    });
}

module.exports = {
    startRiddleQuest
};