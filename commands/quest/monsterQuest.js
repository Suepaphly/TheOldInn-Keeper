
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

    const { updateInteractionSafely } = require('../../utility/combatUtils.js');
    await updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

    // Set up monster combat collector
    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleMonsterCombat(i, userId, collector, activeQuests);
    });
}

async function handleMonsterCombat(interaction, userId, collector, activeQuests) {
    const { handleCombatRound } = require('../../utility/combatUtils.js');
    const quest = activeQuests.get(userId);
    if (!quest) return;

    // Setup combat data for current monster
    const currentMonster = quest.data.monsters[quest.data.round - 1];
    
    if (!currentMonster) {
        console.error(`No monster found for round ${quest.data.round}. Available monsters:`, quest.data.monsters);
        const { endQuest } = require('../quest.js');
        await endQuest(interaction, userId, false, "An error occurred - no monster found for this round!", activeQuests);
        collector.stop();
        return;
    }

    const monsterStats = getMonsterStats(currentMonster, quest.data.combatLevel);

    // Create combat data object for combat utils
    const combatData = {
        playerHealth: quest.data.playerHealth,
        playerMaxHealth: quest.data.playerMaxHealth,
        playerWeapon: quest.data.playerWeapon,
        playerArmor: quest.data.playerArmor,
        combatLevel: quest.data.combatLevel,
        monsterHealth: quest.data.currentMonsterHealth,
        monsterMaxHealth: quest.data.currentMonsterMaxHealth,
        monsterDamage: monsterStats.damage,
        monsterDefense: monsterStats.defense,
        monsterName: currentMonster,
        monsterValue: monsterStats.value,
        round: quest.data.round,
        monsters: quest.data.monsters
    };

    await handleCombatRound(interaction, userId, combatData, 'monster', collector, null, activeQuests);
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
    startMonsterQuest,
    getMonsterStats
};
