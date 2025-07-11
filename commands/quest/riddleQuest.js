
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

const riddles = [
    {
        question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
        options: ["A painting", "A map", "A dream"],
        correct: 1
    },
    {
        question: "The more you take, the more you leave behind. What am I?",
        options: ["Footsteps", "Memories", "Time"],
        correct: 0
    },
    {
        question: "I am not alive, but I grow. I don't have lungs, but I need air. What am I?",
        options: ["A plant", "Fire", "A balloon"],
        correct: 1
    },
    {
        question: "What has keys but no locks, space but no room, and you can enter but not go inside?",
        options: ["A piano", "A keyboard", "A house"],
        correct: 1
    },
    {
        question: "I am tall when I am young, and short when I am old. What am I?",
        options: ["A tree", "A candle", "A person"],
        correct: 1
    },
    {
        question: "What gets wetter the more it dries?",
        options: ["A sponge", "A towel", "Rain"],
        correct: 1
    },
    {
        question: "I have a head and a tail, but no body. What am I?",
        options: ["A snake", "A coin", "A comet"],
        correct: 1
    },
    {
        question: "What can travel around the world while staying in a corner?",
        options: ["A stamp", "A spider", "Light"],
        correct: 0
    },
    {
        question: "I am always hungry and will die if not fed, but whatever I touch will soon turn red. What am I?",
        options: ["A vampire", "Fire", "Rust"],
        correct: 1
    },
    {
        question: "What has many teeth but cannot bite?",
        options: ["A shark", "A comb", "A saw"],
        correct: 1
    },
    {
        question: "I am light as a feather, yet the strongest person cannot hold me for much longer than a minute. What am I?",
        options: ["Air", "Your breath", "A thought"],
        correct: 1
    },
    {
        question: "What breaks but never falls, and what falls but never breaks?",
        options: ["Dawn and night", "Glass and rain", "Silence and tears"],
        correct: 0
    },
    {
        question: "I have no beginning, end, or middle. What am I?",
        options: ["A circle", "Time", "Space"],
        correct: 0
    },
    {
        question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
        options: ["The letter M", "Lightning", "A heartbeat"],
        correct: 0
    },
    {
        question: "I am taken from a mine and shut up in a wooden case, from which I am never released, yet I am used by almost everyone. What am I?",
        options: ["Coal", "A pencil lead", "A diamond"],
        correct: 1
    },
    {
        question: "What has one eye but cannot see?",
        options: ["A cyclops", "A needle", "A potato"],
        correct: 1
    },
    {
        question: "What goes up but never comes down?",
        options: ["A balloon", "Your age", "Smoke"],
        correct: 1
    },
    {
        question: "I am always in front of you but can't be seen. What am I?",
        options: ["Air", "The future", "Your nose"],
        correct: 1
    },
    {
        question: "What has a thumb and four fingers but is not alive?",
        options: ["A statue", "A glove", "A robot"],
        correct: 1
    },
    {
        question: "I can be cracked, made, told, and played. What am I?",
        options: ["A joke", "An egg", "Music"],
        correct: 0
    },
    {
        question: "What runs around the yard without moving?",
        options: ["A dog", "A fence", "The wind"],
        correct: 1
    },
    {
        question: "I have branches but no fruit, trunk, or leaves. What am I?",
        options: ["A tree in winter", "A bank", "A river"],
        correct: 1
    },
    {
        question: "What disappears as soon as you say its name?",
        options: ["A secret", "Silence", "Magic"],
        correct: 1
    }
];

async function startRiddleQuest(interaction, userId, activeQuests) {
    const quest = activeQuests.get(userId);
    quest.data = {
        riddleIndex: Math.floor(Math.random() * riddles.length),
        solved: 0,
        required: 2
    };

    const riddle = riddles[quest.data.riddleIndex];

    const embed = new EmbedBuilder()
        .setTitle("🧩 ANCIENT RIDDLE - 1/2")
        .setColor("#4B0082")
        .setDescription(`**The ancient sphinx speaks:**\n\n*"${riddle.question}"*`)
        .addFields(
            { name: "Progress", value: `${quest.data.solved}/${quest.data.required} riddles solved`, inline: false }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('riddle_0')
                .setLabel(riddle.options[0])
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('riddle_1')
                .setLabel(riddle.options[1])
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('riddle_2')
                .setLabel(riddle.options[2])
                .setStyle(ButtonStyle.Secondary)
        );

    let riddleMessage;
    try {
        if (!interaction.replied && !interaction.deferred) {
            riddleMessage = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        } else {
            riddleMessage = await interaction.editReply({ embeds: [embed], components: [row] });
        }
    } catch (error) {
        if (error.code === 10062 || error.code === 'InteractionNotReplied') {
            riddleMessage = await interaction.followUp({ embeds: [embed], components: [row] });
        } else {
            console.error('Error with interaction:', error);
            throw error;
        }
    }

    const filter = (i) => i.user.id === userId;
    const collector = riddleMessage.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleRiddleAnswer(i, userId, collector, activeQuests);
    });
}

async function handleRiddleAnswer(interaction, userId, collector, activeQuests) {
    const { endQuest, completeQuest } = require('../quest.js');
    const quest = activeQuests.get(userId);
    if (!quest) return;

    const answerIndex = parseInt(interaction.customId.replace('riddle_', ''));
    const riddle = riddles[quest.data.riddleIndex];

    if (answerIndex === riddle.correct) {
        quest.data.solved++;

        if (quest.data.solved >= quest.data.required) {
            // Riddle quest complete!
            await completeQuest(interaction, userId, activeQuests);
            collector.stop();
            return;
        }

        // Next riddle
        let newRiddleIndex;
        do {
            newRiddleIndex = Math.floor(Math.random() * riddles.length);
        } while (newRiddleIndex === quest.data.riddleIndex);

        quest.data.riddleIndex = newRiddleIndex;
        const newRiddle = riddles[newRiddleIndex];

        const embed = new EmbedBuilder()
            .setTitle("🧩 ANCIENT RIDDLE - 2/2")
            .setColor("#4B0082")
            .setDescription(`**Correct!** The sphinx nods approvingly.\n\n*"One more riddle remains: ${newRiddle.question}"*`)
            .addFields(
                { name: "Progress", value: `${quest.data.solved}/${quest.data.required} riddles solved`, inline: false }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('riddle_0')
                    .setLabel(newRiddle.options[0])
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('riddle_1')
                    .setLabel(newRiddle.options[1])
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('riddle_2')
                    .setLabel(newRiddle.options[2])
                    .setStyle(ButtonStyle.Secondary)
            );

        try {
            await interaction.update({ embeds: [embed], components: [row] });
        } catch (error) {
            if (error.code === 10062) {
                await interaction.followUp({ embeds: [embed], components: [row] });
            } else {
                console.error('Error updating interaction:', error);
                throw error;
            }
        }
    } else {
        // Wrong answer - sphinx devours the player
        await db.set(`death_cooldown_${userId}`, Date.now());
        await endQuest(interaction, userId, false, `Wrong answer! The ancient sphinx's eyes glow with fury. "Your ignorance has sealed your fate!" it roars before devouring you whole. You are now dead for 24 hours.`, activeQuests);
        collector.stop();
    }
}

module.exports = {
    startRiddleQuest
};
