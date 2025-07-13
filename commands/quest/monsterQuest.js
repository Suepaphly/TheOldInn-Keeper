
const { CombatSystem, COMBAT_PRESETS } = require('./combatSystem.js');

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
    await startMonsterCombat(interaction, userId, activeQuests, quest.data.currentRound);
}

async function startMonsterCombat(interaction, userId, activeQuests, round) {
    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;
    
    const monsterType = quest.data.monsters[round - 1];
    const enemyData = COMBAT_PRESETS[monsterType](combatLevel);
    
    // Create combat instance
    const combat = CombatSystem.create(userId, 'monster');
    await combat.initializeCombat({}, enemyData);
    
    // Store combat instance in quest data
    quest.data.combat = combat;
    quest.data.currentEnemyValue = enemyData.value;

    const { embed, row } = combat.createCombatEmbed(`You are ambushed by a **${enemyData.name}**! (${round}/2)`);
    
    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

    // Set up combat collector
    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        if (i.customId === 'monster_run') {
            const { endQuest } = require('../quest.js');
            await endQuest(i, userId, false, "You fled from combat! Your quest ends in cowardly retreat.", activeQuests);
            collector.stop();
            return;
        }

        if (i.customId === 'monster_attack') {
            await handleMonsterCombat(i, userId, collector, activeQuests);
        }
    });
}

async function handleMonsterCombat(interaction, userId, collector, activeQuests) {
    const quest = activeQuests.get(userId);
    if (!quest || !quest.data.combat) return;

    const combatResult = await quest.data.combat.processCombatRound();
    
    if (combatResult.result === 'victory') {
        // Add monster value to total
        quest.data.totalMonsterValue += quest.data.currentEnemyValue;
        
        // Check if all monsters defeated
        if (quest.data.currentRound >= quest.data.maxRounds) {
            // All monsters defeated - complete quest
            const { completeQuest } = require('../quest.js');
            const questData = activeQuests.get(userId);
            if (questData) {
                questData.totalMonsterValue = quest.data.totalMonsterValue;
            }
            await completeQuest(interaction, userId, activeQuests);
            collector.stop();
        } else {
            // Move to next monster
            quest.data.currentRound++;
            
            const embed = new EmbedBuilder()
                .setTitle("⚔️ MONSTER DEFEATED!")
                .setColor("#00FF00")
                .setDescription(`${combatResult.battleText}\n\n**Enemy defeated!** You prepare for the next challenge...`)
                .addFields(
                    { name: "Progress", value: `${quest.data.currentRound - 1}/${quest.data.maxRounds} monsters defeated`, inline: false }
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('monster_next')
                        .setLabel('➡️ Face Next Monster')
                        .setStyle(ButtonStyle.Primary)
                );

            await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
            
            // Set up next monster collector
            const nextFilter = (i) => i.user.id === userId;
            const nextCollector = interaction.message.createMessageComponentCollector({ filter: nextFilter, time: 1800000 });
            
            nextCollector.on('collect', async (i) => {
                if (i.customId === 'monster_next') {
                    await startMonsterCombat(i, userId, activeQuests, quest.data.currentRound);
                    nextCollector.stop();
                }
            });
            
            collector.stop();
        }
    } else if (combatResult.result === 'defeat') {
        const { endQuest } = require('../quest.js');
        await endQuest(interaction, userId, false, await quest.data.combat.handleDefeat(), activeQuests);
        collector.stop();
    } else {
        // Combat continues
        const { embed, row } = quest.data.combat.createCombatEmbed(combatResult.battleText);
        await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
    }
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

const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    startMonsterQuest
};
