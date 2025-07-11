const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

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

    try {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [row] });
        } else {
            await interaction.editReply({ embeds: [embed], components: [row] });
        }
    } catch (error) {
        if (error.code === 10062 || error.code === 'InteractionNotReplied') {
            await interaction.followUp({ embeds: [embed], components: [row] });
        } else {
            console.error('Error with interaction:', error);
            throw error;
        }
    }

    const filter = (i) => i.user.id === userId;

    // Get the message from the interaction response
    let message;
    try {
        if (interaction.replied || interaction.deferred) {
            message = await interaction.fetchReply();
        } else {
            message = interaction.message;
        }
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

    quest.data.mazeCombatData = {
        playerHealth: 5 + (combatLevel * 2),
        playerMaxHealth: 5 + (combatLevel * 2),
        playerWeapon: await getBestWeapon(userId),
        playerArmor: await getBestArmor(userId),
        combatLevel: combatLevel,
        monsterHealth: 15 + (combatLevel * 3), // Vine beast is stronger
        monsterMaxHealth: 15 + (combatLevel * 3),
        monsterDamage: 3 + combatLevel,
        monsterDefense: Math.floor(combatLevel * 0.5),
        round: 0
    };

    const embed = new EmbedBuilder()
        .setTitle("🌿 HEDGE MAZE - VINE BEAST COMBAT")
        .setColor("#FF0000")
        .setDescription("A massive vine beast blocks your path!")
        .addFields(
            { name: "Your Health", value: `${quest.data.mazeCombatData.playerHealth}/${quest.data.mazeCombatData.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.mazeCombatData.playerWeapon.name, inline: true },
            { name: "Your Armor", value: quest.data.mazeCombatData.playerArmor.name, inline: true },
            { name: "Vine Beast Health", value: `${quest.data.mazeCombatData.monsterHealth}/${quest.data.mazeCombatData.monsterMaxHealth} HP`, inline: true },
            { name: "Enemy", value: "Vine Beast", inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('maze_combat_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('maze_combat_run')
                .setLabel('🏃 Run Away')
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

    // Set up maze combat collector
    const filter = (i) => i.user.id === userId;

    // Get the message from the interaction response
    let message;
    try {
        if (interaction.replied || interaction.deferred) {
            message = await interaction.fetchReply();
        } else {
            message = interaction.message;
        }
    } catch (error) {
        console.error('Error getting message for maze combat collector:', error);
        return;
    }

    const collector = message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleMazeCombatAttack(i, userId, collector, parentCollector, activeQuests);
    });
}

async function handleMazeCombatAttack(interaction, userId, collector, parentCollector, activeQuests) {
    const { endQuest } = require('../quest.js');
    const quest = activeQuests.get(userId);
    if (!quest || !quest.data.mazeCombatData) return;

    if (interaction.customId === 'maze_combat_run') {
        await endQuest(interaction, userId, false, "You fled from the vine beast! Your quest ends in cowardly retreat.", activeQuests);
        collector.stop();
        parentCollector.stop();
        return;
    }

    quest.data.mazeCombatData.round++;

    // Player attacks first
    const playerCombatDamage = quest.data.mazeCombatData.combatLevel + 1;
    const playerWeaponDamage = Math.floor(Math.random() * (quest.data.mazeCombatData.playerWeapon.maxDamage - quest.data.mazeCombatData.playerWeapon.minDamage + 1)) + quest.data.mazeCombatData.playerWeapon.minDamage;
    const playerTotalDamage = playerCombatDamage + playerWeaponDamage;
    const playerFinalDamage = Math.max(1, playerTotalDamage - quest.data.mazeCombatData.monsterDefense);

    quest.data.mazeCombatData.monsterHealth -= playerFinalDamage;
    quest.data.mazeCombatData.monsterHealth = Math.max(0, quest.data.mazeCombatData.monsterHealth);

    let battleText = `You attack the vine beast for ${playerFinalDamage} damage!`;

    // Check if vine beast is defeated
    if (quest.data.mazeCombatData.monsterHealth <= 0) {
        // Player wins - show victory message first with continue button
        const embed = new EmbedBuilder()
            .setTitle("🌿 HEDGE MAZE - VICTORY!")
            .setColor("#00FF00")
            .setDescription(`${battleText}\n\n**Vine beast defeated!** The massive creature falls with a thunderous crash, clearing your path forward.`)
            .addFields(
                { name: "Victory", value: "You stand victorious over the defeated beast!", inline: false }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('maze_victory_continue')
                    .setLabel('➡️ Continue Deeper')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.update({ embeds: [embed], components: [row] });

        // Set up collector for continue button
        const filter = (i) => i.user.id === userId;
        const continueCollector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

        continueCollector.on('collect', async (i) => {
            if (i.customId === 'maze_victory_continue') {
                quest.data.stage = 2;

                const nextEmbed = new EmbedBuilder()
                    .setTitle("🌿 HEDGE MAZE - Stage 2/2")
                    .setColor("#228B22")
                    .setDescription("You advance deeper into the maze. The air grows thick with ancient magic.\n\n⚠️ **FINAL STAGE** - Choose very carefully:")
                    .addFields(
                        { name: "🚪 Path 1", value: "A golden archway beckoning", inline: true },
                        { name: "🚪 Path 2", value: "A dark tunnel with echoes", inline: true },
                        { name: "🚪 Path 3", value: "A bright exit with sunlight", inline: true },
                        { name: "💀 DANGER", value: "Wrong choice here means death!", inline: false }
                    );

                const nextRow = new ActionRowBuilder()
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

                await i.update({ embeds: [nextEmbed], components: [nextRow] });
                continueCollector.stop();
            }
        });

        collector.stop();
        return;
    }

    // Monster attacks back
    const monsterFinalDamage = Math.max(1, quest.data.mazeCombatData.monsterDamage - quest.data.mazeCombatData.playerArmor.defense);
    quest.data.mazeCombatData.playerHealth -= monsterFinalDamage;
    quest.data.mazeCombatData.playerHealth = Math.max(0, quest.data.mazeCombatData.playerHealth);

    battleText += `\nThe vine beast lashes back for ${monsterFinalDamage} damage!`;

    // Check if player died
    if (quest.data.mazeCombatData.playerHealth <= 0) {
        // Player dies in quest
        await endQuest(interaction, userId, false, "You were defeated by the vine beast! Your quest ends in failure.", activeQuests);
        collector.stop();
        parentCollector.stop();
        return;
    }

    // Combat continues
    const embed = new EmbedBuilder()
        .setTitle(`🌿 HEDGE MAZE - VINE BEAST COMBAT - Round ${quest.data.mazeCombatData.round}`)
        .setColor("#FF0000")
        .setDescription(`${battleText}\n\nThe battle continues!`)
        .addFields(
            { name: "Your Health", value: `${quest.data.mazeCombatData.playerHealth}/${quest.data.mazeCombatData.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.mazeCombatData.playerWeapon.name, inline: true },
            { name: "Your Armor", value: quest.data.mazeCombatData.playerArmor.name, inline: true },
            { name: "Vine Beast Health", value: `${quest.data.mazeCombatData.monsterHealth}/${quest.data.mazeCombatData.monsterMaxHealth} HP`, inline: true },
            { name: "Enemy", value: "Vine Beast", inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('maze_combat_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('maze_combat_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row] });
}

async function getBestWeapon(userId) {
    const weapons = [
        { type: "rifle", name: "Rifle", minDamage: 6, maxDamage: 12 },
        { type: "shotgun", name: "Shotgun", minDamage: 4, maxDamage: 10 },
        { type: "pistol", name: "Pistol", minDamage: 3, maxDamage: 5 },
        { type: "sword", name: "Sword", minDamage: 2, maxDamage: 4 },
        { type: "knife", name: "Knife", minDamage: 1, maxDamage: 3 }
    ];

    for (const weapon of weapons) {
        const count = await db.get(`weapon_${weapon.type}_${userId}`) || 0;
        if (count > 0) {
            return weapon;
        }
    }

    return { type: "none", name: "Fists", minDamage: 0, maxDamage: 0 };
}

async function getBestArmor(userId) {
    const armors = [
        { type: "plate", name: "Plate Armor", defense: 10 },
        { type: "studded", name: "Studded Armor", defense: 5 },
        { type: "chainmail", name: "Chainmail Armor", defense: 3 },
        { type: "leather", name: "Leather Armor", defense: 2 },
        { type: "cloth", name: "Cloth Armor", defense: 1 }
    ];

    for (const armor of armors) {
        const count = await db.get(`armor_${armor.type}_${userId}`) || 0;
        if (count > 0) {
            return armor;
        }
    }

    return { type: "none", name: "No Armor", defense: 0 };
}

module.exports = {
    startMazeQuest
};