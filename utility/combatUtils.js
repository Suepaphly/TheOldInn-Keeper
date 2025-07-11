
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

async function updateInteractionSafely(interaction, options) {
    try {
        if (interaction.replied || interaction.deferred) {
            return await interaction.editReply(options);
        } else {
            return await interaction.update(options);
        }
    } catch (error) {
        if (error.code === 10062 || error.code === 'InteractionNotReplied') {
            // Interaction expired, try followUp
            try {
                return await interaction.followUp(options);
            } catch (followUpError) {
                console.error('Failed to send follow-up message:', followUpError);
                throw followUpError;
            }
        } else {
            console.error('Error updating interaction:', error);
            throw error;
        }
    }
}

async function handleCombatRound(interaction, userId, combatData, combatType, collector, parentCollector, activeQuests) {
    const { endQuest } = require('../commands/quest.js');
    const quest = activeQuests.get(userId);
    if (!quest) return;

    if (interaction.customId.includes('_run')) {
        await endQuest(interaction, userId, false, "You fled from combat! Your quest ends in cowardly retreat.", activeQuests);
        collector.stop();
        if (parentCollector) parentCollector.stop();
        return;
    }

    combatData.round++;

    // Player attacks first
    const playerCombatDamage = combatData.combatLevel + 1;
    const playerWeaponDamage = Math.floor(Math.random() * (combatData.playerWeapon.maxDamage - combatData.playerWeapon.minDamage + 1)) + combatData.playerWeapon.minDamage;
    const playerTotalDamage = playerCombatDamage + playerWeaponDamage;
    
    let enemyDefense = 0;
    if (combatType === 'vengeance') {
        enemyDefense = 0; // No armor for vengeance enemy
    } else if (combatType === 'maze') {
        enemyDefense = combatData.monsterDefense || 0;
    } else {
        // For other combat types, calculate defense based on enemy stats
        enemyDefense = combatData.monsterDefense || 0;
    }
    
    const playerFinalDamage = Math.max(1, playerTotalDamage - enemyDefense);

    // Apply damage to enemy
    if (combatType === 'vengeance') {
        combatData.vengeanceHealth -= playerFinalDamage;
        combatData.vengeanceHealth = Math.max(0, combatData.vengeanceHealth);
    } else {
        combatData.monsterHealth -= playerFinalDamage;
        combatData.monsterHealth = Math.max(0, combatData.monsterHealth);
    }

    let battleText = `You attack for ${playerFinalDamage} damage!`;

    // Check if enemy is defeated
    const enemyHealth = combatType === 'vengeance' ? combatData.vengeanceHealth : combatData.monsterHealth;
    if (enemyHealth <= 0) {
        return await handleCombatVictory(interaction, userId, combatData, combatType, collector, parentCollector, activeQuests, battleText);
    }

    // Enemy attacks back
    let enemyDamage;
    if (combatType === 'vengeance') {
        enemyDamage = Math.floor(Math.random() * 3) + 3; // 3-5 damage for pistol
    } else {
        enemyDamage = combatData.monsterDamage || 2;
    }
    
    const enemyFinalDamage = Math.max(1, enemyDamage - combatData.playerArmor.defense);
    combatData.playerHealth -= enemyFinalDamage;
    combatData.playerHealth = Math.max(0, combatData.playerHealth);

    battleText += `\nThe enemy retaliates for ${enemyFinalDamage} damage!`;

    // Check if player died
    if (combatData.playerHealth <= 0) {
        let deathMessage = "You were defeated in combat!";
        if (combatType === 'vengeance') {
            deathMessage = "You were killed by the vengeful relative! Your quest ends in tragedy.";
        } else if (combatType === 'maze') {
            deathMessage = "You were defeated by the vine beast! Your quest ends in failure.";
        }
        
        await endQuest(interaction, userId, false, deathMessage, activeQuests);
        collector.stop();
        if (parentCollector) parentCollector.stop();
        return;
    }

    // Combat continues - create embed and buttons
    const { embed, row } = createCombatEmbed(combatData, combatType, battleText);
    
    await updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
}

async function handleCombatVictory(interaction, userId, combatData, combatType, collector, parentCollector, activeQuests, battleText) {
    if (combatType === 'vengeance') {
        // Vengeance victory - give rewards and continue quest
        const { QuickDB } = require("quick.db");
        const db = new QuickDB();
        
        await db.add(`money_${userId}`, 25);
        await db.add(`weapon_pistol_${userId}`, 1);

        const embed = new EmbedBuilder()
            .setTitle("🏆 VENGEANCE DEFEATED")
            .setColor("#00FF00")
            .setDescription(`${battleText}\n\nYou have defeated your attacker in self-defense!\n\n**Rewards:**\n💰 +25 kopeks\n🔫 +1 pistol`)
            .addFields(
                { name: "Victory", value: "You continue your quest with a heavy heart.", inline: false }
            );

        const continueRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('trolley_vengeance_continue')
                    .setLabel('➡️ Continue Quest')
                    .setStyle(ButtonStyle.Primary)
            );

        await updateInteractionSafely(interaction, { embeds: [embed], components: [continueRow] });
        collector.stop();
        return;
    } else {
        // Regular quest combat victory
        const { completeQuest } = require('../commands/quest.js');
        
        let victoryTitle, victoryDescription;
        if (combatType === 'maze') {
            victoryTitle = "🌿 HEDGE MAZE - VICTORY!";
            victoryDescription = `${battleText}\n\n**Vine beast defeated!** The massive creature falls with a thunderous crash, clearing your path forward.`;
        } else {
            victoryTitle = "⚔️ COMBAT VICTORY!";
            victoryDescription = `${battleText}\n\n**Enemy defeated!** You stand victorious over your fallen foe.`;
        }

        const embed = new EmbedBuilder()
            .setTitle(victoryTitle)
            .setColor("#00FF00")
            .setDescription(victoryDescription)
            .addFields(
                { name: "Victory", value: "You stand victorious!", inline: false }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('combat_victory_continue')
                    .setLabel('➡️ Continue')
                    .setStyle(ButtonStyle.Primary)
            );

        await updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

        // Set up collector for continue button
        const filter = (i) => i.user.id === userId;
        const continueCollector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

        continueCollector.on('collect', async (i) => {
            if (i.customId === 'combat_victory_continue') {
                await completeQuest(i, userId, activeQuests);
                continueCollector.stop();
            }
        });

        collector.stop();
        return;
    }
}

function createCombatEmbed(combatData, combatType, battleText) {
    let title, enemyName, enemyHealth, enemyMaxHealth;
    
    if (combatType === 'vengeance') {
        title = `⚔️ VENGEANCE COMBAT - Round ${combatData.round}`;
        enemyName = "Pistol";
        enemyHealth = combatData.vengeanceHealth;
        enemyMaxHealth = combatData.vengeanceMaxHealth;
    } else if (combatType === 'maze') {
        title = `🌿 HEDGE MAZE - VINE BEAST COMBAT - Round ${combatData.round}`;
        enemyName = "Vine Beast";
        enemyHealth = combatData.monsterHealth;
        enemyMaxHealth = combatData.monsterMaxHealth;
    } else {
        title = `⚔️ COMBAT - Round ${combatData.round}`;
        enemyName = "Enemy";
        enemyHealth = combatData.monsterHealth;
        enemyMaxHealth = combatData.monsterMaxHealth;
    }

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor("#FF0000")
        .setDescription(`${battleText}\n\nThe battle continues!`)
        .addFields(
            { name: "Your Health", value: `${combatData.playerHealth}/${combatData.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: combatData.playerWeapon.name, inline: true },
            { name: "Your Armor", value: combatData.playerArmor.name, inline: true },
            { name: "Enemy Health", value: `${enemyHealth}/${enemyMaxHealth} HP`, inline: true },
            { name: "Enemy Weapon", value: enemyName, inline: true }
        );

    const customId = combatType === 'vengeance' ? 'vengeance' : combatType === 'maze' ? 'maze_combat' : 'combat';
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`${customId}_attack`)
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`${customId}_run`)
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    return { embed, row };
}

module.exports = {
    updateInteractionSafely,
    handleCombatRound,
    handleCombatVictory,
    createCombatEmbed
};
