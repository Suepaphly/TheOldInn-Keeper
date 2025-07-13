
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { CombatSystem } = require('./combatSystem.js');
const { canAddToBackpack, getBackpackFullMessage } = require('../../utility/backpackUtils.js');

// Dragon data for each location
const dragonData = {
    plains: {
        name: "Ancient White Dragon",
        color: "white",
        crystal: "White Crystal",
        specialMove: "Tax",
        specialDescription: "steals 10% of your coins"
    },
    forest: {
        name: "Ancient Black Dragon",
        color: "black", 
        crystal: "Black Crystal",
        specialMove: "Death",
        specialDescription: "has a 10% chance to instantly kill you"
    },
    redlands: {
        name: "Ancient Red Dragon",
        color: "red",
        crystal: "Red Crystal", 
        specialMove: "Melt",
        specialDescription: "destroys a random item in your backpack"
    },
    frostlands: {
        name: "Ancient Blue Dragon",
        color: "blue",
        crystal: "Blue Crystal",
        specialMove: "Freeze", 
        specialDescription: "you skip your next turn"
    },
    emeraldlands: {
        name: "Ancient Green Dragon",
        color: "green",
        crystal: "Green Crystal",
        specialMove: "Heal",
        specialDescription: "heals the dragon for 2-8 health"
    }
};

class DragonCombatSystem extends CombatSystem {
    constructor(userId, location) {
        super(userId, 'dragon');
        this.location = location;
        this.dragon = dragonData[location];
        this.playerFrozen = false;
    }

    createCombatEmbed(battleText = "") {
        if (!this.combatData) throw new Error("Dragon combat not initialized");

        const embed = new EmbedBuilder()
            .setTitle(`🐲 BOSS BATTLE - ${this.combatData.enemyName}`)
            .setColor("#8B0000")
            .setDescription(battleText || "The ancient dragon prepares to strike!")
            .addFields(
                { name: "Your Health", value: `${this.combatData.playerHealth}/${this.combatData.playerMaxHealth} HP`, inline: true },
                { name: "Your Weapon", value: this.combatData.playerWeapon.name, inline: true },
                { name: "Your Armor", value: this.combatData.playerArmor.name, inline: true },
                { name: "Dragon Health", value: `${this.combatData.enemyHealth}/${this.combatData.enemyMaxHealth} HP`, inline: true },
                { name: "Dragon", value: this.combatData.enemyName, inline: true },
                { name: "Special Ability", value: `${this.dragon.specialMove} - ${this.dragon.specialDescription}`, inline: true }
            );

        let row;
        if (this.playerFrozen) {
            embed.addFields({ name: "❄️ Status", value: "You are frozen and must skip this turn!", inline: false });
            
            row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('dragon_skip_turn')
                        .setLabel('❄️ Skip Turn (Frozen)')
                        .setStyle(ButtonStyle.Secondary)
                );
        } else {
            row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('dragon_attack')
                        .setLabel('⚔️ Attack')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('dragon_run')
                        .setLabel('🏃 Run Away')
                        .setStyle(ButtonStyle.Secondary)
                );
        }

        return { embed, row };
    }

    async processCombatRound() {
        if (!this.combatData || !this.combatData.isActive) return null;

        this.combatData.round++;

        // If player is frozen, unfreeze them for next turn
        if (this.playerFrozen) {
            this.playerFrozen = false;
            return {
                result: 'continue',
                battleText: "You shake off the frost and can act again!",
                combatData: this.combatData
            };
        }

        // Player attacks first (same as base combat system)
        const playerCombatDamage = this.combatData.combatLevel + 1;
        const playerWeaponDamage = Math.floor(Math.random() * 
            (this.combatData.playerWeapon.maxDamage - this.combatData.playerWeapon.minDamage + 1)) + 
            this.combatData.playerWeapon.minDamage;
        const playerTotalDamage = playerCombatDamage + playerWeaponDamage;
        const playerFinalDamage = Math.max(1, playerTotalDamage - this.combatData.enemyDefense);

        // Apply damage to dragon
        this.combatData.enemyHealth -= playerFinalDamage;
        this.combatData.enemyHealth = Math.max(0, this.combatData.enemyHealth);

        let battleText = `You attack the ${this.dragon.name} for ${playerFinalDamage} damage!`;

        // Check if dragon is defeated
        if (this.combatData.enemyHealth <= 0) {
            this.combatData.isActive = false;
            return {
                result: 'victory',
                battleText: battleText,
                combatData: this.combatData
            };
        }

        // Dragon attacks back - choose between breath weapon and special move
        const useSpecialMove = Math.random() < 0.3; // 30% chance for special move
        
        if (useSpecialMove) {
            const specialResult = await this.executeSpecialMove();
            battleText += `\n${specialResult}`;
        } else {
            // Breath weapon attack (6-12 damage)
            const breathDamage = Math.floor(Math.random() * 7) + 6; // 6-12 damage
            const finalBreathDamage = Math.max(1, breathDamage - this.combatData.playerArmor.defense);
            this.combatData.playerHealth -= finalBreathDamage;
            this.combatData.playerHealth = Math.max(0, this.combatData.playerHealth);
            
            battleText += `\nThe ${this.dragon.name} unleashes its breath weapon for ${finalBreathDamage} damage!`;
        }

        // Check if player died
        if (this.combatData.playerHealth <= 0) {
            this.combatData.isActive = false;
            return {
                result: 'defeat',
                battleText: battleText,
                combatData: this.combatData
            };
        }

        // Combat continues
        return {
            result: 'continue',
            battleText: battleText,
            combatData: this.combatData
        };
    }

    async executeSpecialMove() {
        switch (this.location) {
            case 'plains': // White Dragon - Tax
                const currentMoney = await db.get(`money_${this.userId}`) || 0;
                const stolen = Math.floor(currentMoney * 0.1);
                if (stolen > 0) {
                    await db.sub(`money_${this.userId}`, stolen);
                    return `The White Dragon casts Tax! It steals ${stolen} kopeks from your wallet!`;
                } else {
                    return `The White Dragon casts Tax, but you have no money to steal!`;
                }

            case 'forest': // Black Dragon - Death
                if (Math.random() < 0.1) { // 10% chance
                    this.combatData.playerHealth = 0;
                    return `The Black Dragon casts Death! You feel your life force drain away instantly!`;
                } else {
                    return `The Black Dragon casts Death, but you resist its dark magic!`;
                }

            case 'redlands': // Red Dragon - Melt
                const items = await this.getBackpackItems();
                if (items.length > 0) {
                    const randomItem = items[Math.floor(Math.random() * items.length)];
                    await db.sub(randomItem.key, 1);
                    return `The Red Dragon casts Melt! Your ${randomItem.name} is destroyed by the intense heat!`;
                } else {
                    return `The Red Dragon casts Melt, but you have no items to destroy!`;
                }

            case 'frostlands': // Blue Dragon - Freeze
                this.playerFrozen = true;
                return `The Blue Dragon casts Freeze! You are encased in ice and will skip your next turn!`;

            case 'emeraldlands': // Green Dragon - Heal
                const healAmount = Math.floor(Math.random() * 7) + 2; // 2-8 healing
                this.combatData.enemyHealth = Math.min(this.combatData.enemyMaxHealth, this.combatData.enemyHealth + healAmount);
                return `The Green Dragon casts Heal! It recovers ${healAmount} health!`;

            default:
                return `The dragon uses an unknown special move!`;
        }
    }

    async getBackpackItems() {
        const items = [];
        
        // Get all weapons
        const weapons = ['knife', 'sword', 'pistol', 'shotgun', 'rifle'];
        for (const weapon of weapons) {
            const count = await db.get(`weapon_${weapon}_${this.userId}`) || 0;
            if (count > 0) {
                items.push({ key: `weapon_${weapon}_${this.userId}`, name: weapon, type: 'weapon' });
            }
        }

        // Get all armor
        const armors = ['cloth', 'leather', 'chainmail', 'studded', 'plate'];
        for (const armor of armors) {
            const count = await db.get(`armor_${armor}_${this.userId}`) || 0;
            if (count > 0) {
                items.push({ key: `armor_${armor}_${this.userId}`, name: `${armor} armor`, type: 'armor' });
            }
        }

        return items;
    }

    async handleVictory() {
        const dragon = this.dragon;
        
        // Check if this is debug mode
        const { activeQuests } = require('../quest.js');
        const quest = activeQuests.get(this.userId);
        if (quest && quest.isDebug) {
            return `🔧 **DEBUG VICTORY!**\n\nYou have slain the mighty ${dragon.name}! In normal mode, a ${dragon.crystal} would materialize and fly into your backpack. This rare artifact would pulse with ancient power...\n\n*Debug mode - no actual rewards given.*`;
        }
        
        // Check if player can carry the crystal
        const canAdd = await canAddToBackpack(this.userId, 1);
        if (!canAdd) {
            return `You defeated the ${dragon.name}! However, ${getBackpackFullMessage()}`;
        }

        // Award the crystal
        const crystalKey = `crystal_${dragon.color}_${this.userId}`;
        await db.add(crystalKey, 1);

        return `You have slain the mighty ${dragon.name}! As it falls, a ${dragon.crystal} materializes and flies into your backpack. This rare artifact pulses with ancient power...`;
    }

    async handleDefeat() {
        await db.set(`death_cooldown_${this.userId}`, Date.now());
        return `The ${this.dragon.name} has defeated you! Your quest ends in death. You are now dead for 24 hours.`;
    }
}

async function startDragonBattle(interaction, userId, location, activeQuests) {
    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;

    // Create dragon combat system
    const dragonCombat = new DragonCombatSystem(userId, location);
    
    // Initialize combat with dragon stats
    const dragonStats = {
        name: dragonData[location].name,
        health: 50,
        maxHealth: 50,
        damage: 8, // Base damage for regular attacks
        defense: 2,
        value: 0
    };

    await dragonCombat.initializeCombat({}, dragonStats);

    // Store combat instance in quest data
    quest.data = quest.data || {};
    quest.data.combat = dragonCombat;

    const { embed, row } = dragonCombat.createCombatEmbed("The ancient dragon roars and prepares to attack!");
    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

    // Set up dragon combat collector
    const filter = (i) => i.user.id === userId;
    
    let message;
    try {
        if (interaction.replied || interaction.deferred) {
            message = await interaction.fetchReply();
        } else {
            message = interaction.message;
        }
    } catch (error) {
        console.error('Error getting message for dragon combat collector:', error);
        return;
    }
    
    const collector = message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleDragonCombat(i, userId, collector, activeQuests);
    });
}

async function handleDragonCombat(interaction, userId, collector, activeQuests) {
    const { endQuest, completeQuest } = require('../quest.js');
    const quest = activeQuests.get(userId);
    if (!quest || !quest.data.combat) return;

    const dragonCombat = quest.data.combat;

    if (interaction.customId === 'dragon_run') {
        await endQuest(interaction, userId, false, "You fled from the dragon! Your quest ends in cowardly retreat.", activeQuests);
        collector.stop();
        return;
    }

    if (interaction.customId === 'dragon_skip_turn') {
        // Player skips turn due to freeze
        const combatResult = await dragonCombat.processCombatRound();
        
        if (combatResult && combatResult.result === 'continue') {
            const { embed, row } = dragonCombat.createCombatEmbed(combatResult.battleText);
            await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
        }
        return;
    }

    if (interaction.customId === 'dragon_attack') {
        try {
            const combatResult = await dragonCombat.processCombatRound();

            if (combatResult.result === 'victory') {
                const victoryMessage = await dragonCombat.handleVictory();
                await completeQuest(interaction, userId, activeQuests, victoryMessage);
                collector.stop();
            } else if (combatResult.result === 'defeat') {
                const defeatMessage = await dragonCombat.handleDefeat();
                await endQuest(interaction, userId, false, defeatMessage, activeQuests);
                collector.stop();
            } else {
                // Combat continues
                const { embed, row } = dragonCombat.createCombatEmbed(combatResult.battleText);
                await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
            }
        } catch (error) {
            console.error('Error in dragon combat:', error);
            await endQuest(interaction, userId, false, "An error occurred during dragon combat. Your quest ends.", activeQuests);
            collector.stop();
        }
    }
}

module.exports = {
    startDragonBattle,
    DragonCombatSystem
};
