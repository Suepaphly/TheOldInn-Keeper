const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const CombatSystem = require('./combatSystem.js');
const { COMBAT_PRESETS } = CombatSystem;

async function startMonsterQuest(interaction, userId, activeQuests) {
    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;

    quest.data = {
        currentRound: 1,
        maxRounds: 2,
        monsters: ["goblinScout", "orcRaider"],
        totalMonsterValue: 0
    };

    // Start first monster combat
    await startMonsterCombat(interaction, userId, activeQuests, 1);
}

async function startMonsterCombat(interaction, userId, activeQuests, round) {
    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;

    const monsterType = quest.data.monsters[round - 1];
    const enemyData = COMBAT_PRESETS[monsterType](combatLevel);

    // Create combat instance
    const combat = CombatSystem.create(userId, 'monster');
    await combat.initializeCombat({}, enemyData);

    // Store combat data
    quest.data.combat = combat;
    quest.data.currentEnemyValue = enemyData.value;

    const { embed, row } = combat.createCombatEmbed(`You are ambushed by a **${enemyData.name}**! (${round}/2)`);

    // Always update the existing message instead of creating a new one
    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

    // Set up combat collector
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
        console.error('Error getting message for monster combat collector:', error);
        return;
    }

    const collector = message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        try {
            if (i.customId === 'monster_run') {
                const { endQuest } = require('../quest.js');
                await endQuest(i, userId, false, "You fled from combat! Your quest ends in cowardly retreat.", activeQuests);
                collector.stop();
                return;
            }

            if (i.customId === 'monster_attack') {
                const combatResult = await quest.data.combat.processCombatRound();

                if (combatResult.result === 'victory') {
                    // Add monster value to quest total
                    quest.totalMonsterValue += quest.data.currentEnemyValue;

                    // Check if there are more monsters
                    if (quest.data.currentRound < quest.data.maxRounds) {
                        // Move to next monster
                        quest.data.currentRound++;

                        const embed = new EmbedBuilder()
                            .setTitle("⚔️ MONSTER DEFEATED!")
                            .setColor("#00FF00")
                            .setDescription(`${combatResult.battleText}\n\nThe monster falls! But wait... you hear more enemies approaching...`)
                            .addFields(
                                { name: "Progress", value: `${quest.data.currentRound - 1}/${quest.data.maxRounds} monsters defeated`, inline: false }
                            );

                        const continueRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('monster_continue')
                                    .setLabel('⚔️ Face Next Monster')
                                    .setStyle(ButtonStyle.Primary)
                            );

                        await CombatSystem.updateInteractionSafely(i, { embeds: [embed], components: [continueRow] });
                        collector.stop();

                        // Set up continue collector
                        const continueFilter = (continueI) => continueI.user.id === userId;
                        const continueCollector = i.channel.createMessageComponentCollector({ filter: continueFilter, time: 1800000 });

                        continueCollector.on('collect', async (continueI) => {
                            try {
                                if (continueI.customId === 'monster_continue') {
                                    await startMonsterCombat(continueI, userId, activeQuests, quest.data.currentRound);
                                    continueCollector.stop();
                                }
                            } catch (error) {
                                console.error('Error in continue collector:', error);
                                continueCollector.stop();
                            }
                        });
                    } else {
                        // All monsters defeated, complete quest
                        const { completeQuest } = require('../quest.js');
                        await completeQuest(i, userId, quest.totalMonsterValue, activeQuests);
                        collector.stop();
                    }
                } else if (combatResult.result === 'defeat') {
                    // Set death cooldown (24 hours)
                    await db.set(`death_cooldown_${userId}`, Date.now());

                    const { endQuest } = require('../quest.js');
                    const defeatMessage = `💀 **YOU HAVE DIED!**\n\nYou have been defeated by the ${quest.data.combat.enemy.name}! Your body lies broken on the battlefield.\n\n⏰ You must wait 24 hours before attempting another quest.`;
                    await endQuest(i, userId, false, defeatMessage, activeQuests);
                    collector.stop();
                } else {
                    // Combat continues
                    const { embed, row } = quest.data.combat.createCombatEmbed(combatResult.battleText);
                    await CombatSystem.updateInteractionSafely(i, { embeds: [embed], components: [row] });
                }
            }
        } catch (error) {
            console.error('Error in monster combat:', error);
            const { endQuest } = require('../quest.js');
            try {
                await endQuest(i, userId, false, "An error occurred during combat. Your quest ends.", activeQuests);
            } catch (e) {
                console.error('Error ending quest:', e);
            }
            collector.stop();
        }
    });

    collector.on('end', () => {
        // Cleanup handled by main quest system
    });
}

module.exports = {
    startMonsterQuest
};