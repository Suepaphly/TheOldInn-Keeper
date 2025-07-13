const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { CombatSystem, COMBAT_PRESETS } = require('./combatSystem.js');

async function startMazeQuest(interaction, userId, activeQuests) {
    const quest = activeQuests.get(userId);
    quest.data = {
        stage: 1,
        maxStage: 2
    };

    const embed = new EmbedBuilder()
        .setTitle("🌿 HEDGE MAZE - Stage 1/2")
        .setColor("#228B22")
        .setDescription("You enter a mysterious hedge maze. Ancient magic crackles in the air.\n\nThree paths stretch before you:")
        .addFields(
            { name: "🚪 Path 1", value: "A narrow passage with strange sounds", inline: true },
            { name: "🚪 Path 2", value: "A wide path with glinting objects", inline: true },
            { name: "🚪 Path 3", value: "A winding path with fresh air", inline: true },
            { name: "⚠️ Warning", value: "Choose wisely - one leads forward, one leads to danger, one leads to traps!", inline: false }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('maze_1')
                .setLabel('🚪 Path 1')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('maze_2')
                .setLabel('🚪 Path 2')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('maze_3')
                .setLabel('🚪 Path 3')
                .setStyle(ButtonStyle.Secondary)
        );

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

    const filter = (i) => i.user.id === userId;

    // Get the message from the interaction response
    let message;
    try {
        message = await interaction.fetchReply();
    } catch (error) {
        console.error('Error getting message for collector:', error);
        return;
    }

    const collector = message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleMazeChoice(i, userId, collector, activeQuests);
    });
}

async function handleMazeChoice(interaction, userId, collector, activeQuests) {
    const { endQuest, completeQuest } = require('../quest.js');
    const quest = activeQuests.get(userId);
    if (!quest) return;

    const pathChoice = parseInt(interaction.customId.replace('maze_', ''));
    const outcomes = [1, 2, 3]; // 1=forward, 2=trap, 3=combat
    const shuffled = outcomes.sort(() => Math.random() - 0.5);
    const result = shuffled[pathChoice - 1];

    if (quest.data.stage === 1) {
        // First stage
        if (result === 1) {
            // Forward
            quest.data.stage = 2;
            const embed = new EmbedBuilder()
                .setTitle("🌿 HEDGE MAZE - Stage 2/2")
                .setColor("#228B22")
                .setDescription("You found the correct path! You advance deeper into the maze.\n\n⚠️ **FINAL STAGE** - Choose very carefully:")
                .addFields(
                    { name: "🚪 Path 1", value: "A golden archway beckoning", inline: true },
                    { name: "🚪 Path 2", value: "A dark tunnel with echoes", inline: true },
                    { name: "🚪 Path 3", value: "A bright exit with sunlight", inline: true },
                    { name: "💀 DANGER", value: "Wrong choice here means death!", inline: false }
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('maze_1')
                        .setLabel('🚪 Path 1')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('maze_2')
                        .setLabel('🚪 Path 2')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('maze_3')
                        .setLabel('🚪 Path 3')
                        .setStyle(ButtonStyle.Secondary)
                );

            await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
        } else if (result === 2) {
            // Trap - lose money
            const loss = Math.floor(Math.random() * 500) + 200;
            const currentMoney = await db.get(`money_${userId}`) || 0;
            if (currentMoney >= loss) {
                await db.sub(`money_${userId}`, loss);
            }
            await endQuest(interaction, userId, false, `You triggered a trap! Spikes shoot from the ground, and you lose ${loss} kopeks before escaping.`, activeQuests);
            collector.stop();
        } else {
            // Combat - fight a vine beast
            quest.data.mazeCombat = true;
            await startMazeCombat(interaction, userId, collector, activeQuests);
        }
    } else {
        // Final stage
        if (result === 1) {
            // Success!
            await completeQuest(interaction, userId, activeQuests);
            collector.stop();
        } else {
            // Death
            await db.set(`death_cooldown_${userId}`, Date.now());
            await endQuest(interaction, userId, false, `You chose poorly. The maze's deadly trap claims your life. You are now dead for 24 hours.`, activeQuests);
            collector.stop();
        }
    }
}

async function startMazeCombat(interaction, userId, parentCollector, activeQuests) {
    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;
    const enemyData = COMBAT_PRESETS.vineBeast(combatLevel);

    // Create combat instance
    const combat = CombatSystem.create(userId, 'maze');
    await combat.initializeCombat({}, enemyData);

    // Store combat instance in quest data
    quest.data.combat = combat;

    const { embed, row } = combat.createCombatEmbed("A massive vine beast blocks your path!");

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

    // Set up maze combat collector
    const filter = (i) => i.user.id === userId;

    // Get the message for the collector
    let message;
    try {
        message = await interaction.fetchReply();
    } catch (error) {
        console.error('Error getting message for maze combat collector:', error);
        return;
    }

    const collector = message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        if (i.customId === 'maze_run') {
            const { endQuest } = require('../quest.js');
            await endQuest(i, userId, false, "You fled from combat! Your quest ends in cowardly retreat.", activeQuests);
            collector.stop();
            parentCollector.stop();
            return;
        }

        if (i.customId === 'maze_attack') {
            const combatResult = await quest.data.combat.processCombatRound();

            if (combatResult.result === 'victory') {
                // Victory - continue maze quest (back to stage 1)
                quest.data.stage = 2;
                quest.data.mazeCombat = false;

                const embed = new EmbedBuilder()
                    .setTitle("🌿 HEDGE MAZE - VINE BEAST DEFEATED")
                    .setColor("#00FF00")
                    .setDescription(`${combatResult.battleText}\n\nYou have defeated the vine beast! The path is now clear.`)
                    .addFields(
                        { name: "Progress", value: "You advance deeper into the maze.", inline: false }
                    );

                const continueRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('maze_continue_after_combat')
                            .setLabel('➡️ Continue Through Maze')
                            .setStyle(ButtonStyle.Primary)
                    );

                await CombatSystem.updateInteractionSafely(i, { embeds: [embed], components: [continueRow] });

                // Set up continue collector
                const continueFilter = (ci) => ci.user.id === userId;

                // Get the updated message for the new collector
                let continueMessage;
                try {
                    continueMessage = await i.fetchReply();
                } catch (error) {
                    console.error('Error getting continue message:', error);
                    return;
                }

                const continueCollector = continueMessage.createMessageComponentCollector({ filter: continueFilter, time: 1800000 });

                continueCollector.on('collect', async (ci) => {
                    if (ci.customId === 'maze_continue_after_combat') {
                        // Show stage 2 paths
                        const stage2Embed = new EmbedBuilder()
                            .setTitle("🌿 HEDGE MAZE - Stage 2/2")
                            .setColor("#228B22")
                            .setDescription("After defeating the beast, you advance deeper into the maze.\n\n⚠️ **FINAL STAGE** - Choose very carefully:")
                            .addFields(
                                { name: "🚪 Path 1", value: "A golden archway beckoning", inline: true },
                                { name: "🚪 Path 2", value: "A dark tunnel with echoes", inline: true },
                                { name: "🚪 Path 3", value: "A bright exit with sunlight", inline: true },
                                { name: "💀 DANGER", value: "Wrong choice here means death!", inline: false }
                            );

                        const stage2Row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('maze_1')
                                    .setLabel('🚪 Path 1')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('maze_2')
                                    .setLabel('🚪 Path 2')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('maze_3')
                                    .setLabel('🚪 Path 3')
                                    .setStyle(ButtonStyle.Secondary)
                            );

                        await CombatSystem.updateInteractionSafely(ci, { embeds: [stage2Embed], components: [stage2Row] });
                        continueCollector.stop();
                    }
                });

                collector.stop();
            } else if (combatResult.result === 'defeat') {
                const { endQuest } = require('../quest.js');
                await endQuest(i, userId, false, await quest.data.combat.handleDefeat(), activeQuests);
                collector.stop();
                parentCollector.stop();
            } else {
                // Combat continues
                const { embed, row } = quest.data.combat.createCombatEmbed(combatResult.battleText);
                await CombatSystem.updateInteractionSafely(i, { embeds: [embed], components: [row] });
            }
        }
    });
}

module.exports = {
    startMazeQuest
};