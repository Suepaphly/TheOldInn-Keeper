
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

async function startMonsterQuest(interaction, userId, activeQuests) {
    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;

    quest.data = {
        round: 1,
        playerHealth: 5 + (combatLevel * 2),
        playerMaxHealth: 5 + (combatLevel * 2),
        playerWeapon: await getBestWeapon(userId),
        playerArmor: await getBestArmor(userId),
        combatLevel: combatLevel,
        monsters: ["Goblin Scout", "Orc Raider"],
        currentMonsterHealth: 0,
        currentMonsterMaxHealth: 0
    };

    // Initialize first monster
    const currentMonster = quest.data.monsters[quest.data.round - 1];
    const monsterStats = getMonsterStats(currentMonster, combatLevel);
    quest.data.currentMonsterHealth = monsterStats.health;
    quest.data.currentMonsterMaxHealth = monsterStats.health;

    const embed = new EmbedBuilder()
        .setTitle(`⚔️ AMBUSH - ${currentMonster} (${quest.data.round}/2)`)
        .setColor("#FF0000")
        .setDescription(`You are ambushed by a **${currentMonster}**!`)
        .addFields(
            { name: "Your Health", value: `${quest.data.playerHealth}/${quest.data.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.playerWeapon?.name || "Unknown", inline: true },
            { name: "Your Armor", value: quest.data.playerArmor?.name || "Unknown", inline: true },
            { name: "Enemy Health", value: `${quest.data.currentMonsterHealth}/${quest.data.currentMonsterMaxHealth} HP`, inline: true },
            { name: "Enemy", value: currentMonster || "Unknown", inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('monster_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('monster_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    try {
        // First check if interaction has been replied to, if not, reply instead of edit
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.update({ embeds: [embed], components: [row] });
        }
    } catch (error) {
        if (error.code === 10062 || error.code === 'InteractionNotReplied') {
            // Interaction expired or not replied, send a new message instead
            await interaction.followUp({ embeds: [embed], components: [row] });
        } else {
            console.error('Error with interaction:', error);
            throw error;
        }
    }

    // Set up monster combat collector
    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleMonsterCombat(i, userId, collector, activeQuests);
    });
}

async function handleMonsterCombat(interaction, userId, collector, activeQuests) {
    const { endQuest, completeQuest } = require('../quest.js');
    const quest = activeQuests.get(userId);
    if (!quest) return;

    if (interaction.customId === 'monster_run') {
        await endQuest(interaction, userId, false, "You fled from the monsters! Your quest ends in cowardly retreat.", activeQuests);
        collector.stop();
        return;
    }

    const currentMonster = quest.data.monsters[quest.data.round - 1];
    const monsterStats = getMonsterStats(currentMonster, quest.data.combatLevel);

    // Player attacks monster
    const playerCombatDamage = quest.data.combatLevel + 1;
    const playerWeaponDamage = Math.floor(Math.random() * (quest.data.playerWeapon.maxDamage - quest.data.playerWeapon.minDamage + 1)) + quest.data.playerWeapon.minDamage;
    const playerTotalDamage = playerCombatDamage + playerWeaponDamage;
    const playerFinalDamage = Math.max(1, playerTotalDamage - monsterStats.defense);

    quest.data.currentMonsterHealth -= playerFinalDamage;
    quest.data.currentMonsterHealth = Math.max(0, quest.data.currentMonsterHealth);

    let battleText = `You attack the ${currentMonster} for ${playerFinalDamage} damage!`;

    // Check if monster is defeated
    if (quest.data.currentMonsterHealth <= 0) {
        quest.totalMonsterValue += monsterStats.value;
        quest.data.round++;

        if (quest.data.round > 2) {
            // Monster quest complete!
            // First reply to the interaction to avoid InteractionNotReplied error
            const embed = new EmbedBuilder()
                .setTitle("⚔️ AMBUSH COMPLETE!")
                .setColor("#00FF00")
                .setDescription(`${battleText}\n\n**All monsters defeated!** You have successfully completed the ambush quest.`);

            await interaction.update({ embeds: [embed], components: [] });
            
            // Now complete the quest
            await completeQuest(interaction, userId, activeQuests);
            collector.stop();
            return;
        }

        // Show victory message first with continue button
        const embed = new EmbedBuilder()
            .setTitle(`⚔️ AMBUSH - ${currentMonster} DEFEATED!`)
            .setColor("#00FF00")
            .setDescription(`${battleText}\n\n**${currentMonster} defeated!** You stand victorious over your fallen foe.`)
            .addFields(
                { name: "Victory", value: "The creature falls to your superior combat skills!", inline: false }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('monster_victory_continue')
                    .setLabel('➡️ Continue')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.update({ embeds: [embed], components: [row] });

        // Set up collector for continue button
        const filter = (i) => i.user.id === userId;
        const continueCollector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

        continueCollector.on('collect', async (i) => {
            if (i.customId === 'monster_victory_continue') {
                // Next monster
                const nextMonster = quest.data.monsters[quest.data.round - 1];
                const nextMonsterStats = getMonsterStats(nextMonster, quest.data.combatLevel);
                quest.data.currentMonsterHealth = nextMonsterStats.health;
                quest.data.currentMonsterMaxHealth = nextMonsterStats.health;

                const nextEmbed = new EmbedBuilder()
                    .setTitle(`⚔️ AMBUSH - ${nextMonster} (${quest.data.round}/2)`)
                    .setColor("#FF0000")
                    .setDescription(`You advance to the next monster.\n\nA **${nextMonster}** appears!`)
                    .addFields(
                        { name: "Your Health", value: `${quest.data.playerHealth}/${quest.data.playerMaxHealth} HP`, inline: true },
                        { name: "Your Weapon", value: quest.data.playerWeapon?.name || "Unknown", inline: true },
                        { name: "Your Armor", value: quest.data.playerArmor?.name || "Unknown", inline: true },
                        { name: "Enemy Health", value: `${quest.data.currentMonsterHealth}/${quest.data.currentMonsterMaxHealth} HP`, inline: true },
                        { name: "Enemy", value: nextMonster || "Unknown", inline: true }
                    );

                const nextRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('monster_attack')
                            .setLabel('⚔️ Attack')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('monster_run')
                            .setLabel('🏃 Run Away')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await i.update({ embeds: [nextEmbed], components: [nextRow] });
                continueCollector.stop();
            }
        });

        return;
    }

    // Monster attacks back
    const monsterFinalDamage = Math.max(1, monsterStats.damage - quest.data.playerArmor.defense);
    quest.data.playerHealth -= monsterFinalDamage;
    quest.data.playerHealth = Math.max(0, quest.data.playerHealth);

    battleText += `\nThe ${currentMonster} retaliates for ${monsterFinalDamage} damage!`;

    // Check if player died
    if (quest.data.playerHealth <= 0) {
        await endQuest(interaction, userId, false, "You were defeated in combat!", activeQuests);
        collector.stop();
        return;
    }

    // Combat continues
    const embed = new EmbedBuilder()
        .setTitle(`⚔️ AMBUSH - ${currentMonster} (${quest.data.round}/2)`)
        .setColor("#FF0000")
        .setDescription(`${battleText}\n\nThe battle continues!`)
        .addFields(
            { name: "Your Health", value: `${quest.data.playerHealth}/${quest.data.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.playerWeapon?.name || "Unknown", inline: true },
            { name: "Your Armor", value: quest.data.playerArmor?.name || "Unknown", inline: true },
            { name: "Enemy Health", value: `${quest.data.currentMonsterHealth}/${quest.data.currentMonsterMaxHealth} HP`, inline: true },
            { name: "Enemy", value: currentMonster || "Unknown", inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('monster_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('monster_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row] });
}

// Helper function to get monster stats scaled to player combat level
function getMonsterStats(monsterName, playerCombatLevel) {
    const basePlayerHealth = 5 + (playerCombatLevel * 2);
    const basePlayerDamage = 1 + playerCombatLevel;

    const monsterConfigs = {
        "Goblin Scout": {
            healthMultiplier: 0.8,
            damageMultiplier: 0.7,
            defense: Math.floor(playerCombatLevel * 0.5),
            value: 25
        },
        "Orc Raider": {
            healthMultiplier: 1.2,
            damageMultiplier: 1.0,
            defense: Math.floor(playerCombatLevel * 0.8),
            value: 40
        }
    };

    const config = monsterConfigs[monsterName] || monsterConfigs["Goblin Scout"];

    return {
        health: Math.floor(basePlayerHealth * config.healthMultiplier) + 5,
        damage: Math.floor(basePlayerDamage * config.damageMultiplier) + 2,
        defense: config.defense,
        value: config.value
    };
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
    startMonsterQuest
};
