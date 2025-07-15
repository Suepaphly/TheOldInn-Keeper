const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Simple combat presets
const COMBAT_PRESETS = {
    goblinScout: (combatLevel) => ({
        name: "Goblin Scout",
        health: 15 + combatLevel,
        maxHealth: 15 + combatLevel,
        damage: 3 + Math.floor(combatLevel / 2),
        defense: 0,
        value: 25
    }),
    orcRaider: (combatLevel) => ({
        name: "Orc Raider", 
        health: 25 + combatLevel * 2,
        maxHealth: 25 + combatLevel * 2,
        damage: 5 + Math.floor(combatLevel / 2),
        defense: 1,
        value: 40
    }),
    vineBeast: (combatLevel) => ({
        name: "Vine Beast",
        health: 20 + combatLevel,
        maxHealth: 20 + combatLevel,
        damage: 4 + Math.floor(combatLevel / 2),
        defense: 1,
        value: 0
    }),
    vengeanceEnemy: (combatLevel) => ({
        name: "Grief-Stricken Relative",
        health: 18 + combatLevel,
        maxHealth: 18 + combatLevel,
        damage: 6 + Math.floor(combatLevel / 2),
        defense: 0,
        value: 0
    })
};

class SimpleCombat {
    constructor(userId, questType) {
        this.userId = userId;
        this.questType = questType;
        this.player = {};
        this.enemy = {};
    }

    async initializeCombat(playerData, enemyData) {
        // Get player stats using equipment calculations like main combat system
        const combatLevel = await db.get(`combatlevel_${this.userId}`) || 0;
        const health = await db.get(`health_${this.userId}`) || 100;
        
        // Get equipped weapon and armor
        const equippedWeapon = await this.getBestWeapon();
        const equippedArmor = await this.getBestArmor();
        
        // Calculate damage (base + combat level + weapon damage)
        const baseDamage = 5 + combatLevel;
        const weaponDamage = equippedWeapon.damage || 0;
        const totalDamage = baseDamage + weaponDamage;
        
        // Calculate defense from armor
        const armorDefense = equippedArmor.defense || 0;

        this.player = {
            name: "You",
            health: health,
            maxHealth: health,
            damage: totalDamage,
            defense: armorDefense,
            weapon: equippedWeapon,
            armor: equippedArmor
        };

        this.enemy = { ...enemyData };
    }

    createCombatEmbed(message = "") {
        const embed = new EmbedBuilder()
            .setTitle(`⚔️ Combat - ${this.enemy.name}`)
            .setColor("#FF4500")
            .setDescription(message || "What will you do?")
            .addFields(
                { name: "Your Health", value: `${this.player.health}/${this.player.maxHealth} HP`, inline: true },
                { name: `${this.enemy.name}`, value: `${this.enemy.health}/${this.enemy.maxHealth} HP`, inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "Your Weapon", value: `${this.player.weapon.name} (+${this.player.weapon.damage} damage)`, inline: true },
                { name: "Your Armor", value: `${this.player.armor.name} (+${this.player.armor.defense} defense)`, inline: true },
                { name: "\u200B", value: "\u200B", inline: true }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`${this.questType}_attack`)
                    .setLabel('⚔️ Attack')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`${this.questType}_run`)
                    .setLabel('🏃 Run Away')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embed, row };
    }

    async processCombatRound() {
        // Player attacks
        const playerDamage = Math.max(1, this.player.damage + Math.floor(Math.random() * 4) - 2);
        const damageDealt = Math.max(1, playerDamage - this.enemy.defense);
        this.enemy.health -= damageDealt;

        let battleText = `You attack for ${damageDealt} damage!`;

        if (this.enemy.health <= 0) {
            battleText += `\n\n🎉 **${this.enemy.name} defeated!**`;
            await this.handleVictory();
            return { result: 'victory', battleText };
        }

        // Enemy attacks
        const enemyDamage = Math.max(1, this.enemy.damage + Math.floor(Math.random() * 4) - 2);
        const playerDamageReceived = Math.max(1, enemyDamage - this.player.defense);
        this.player.health -= playerDamageReceived;

        battleText += `\n${this.enemy.name} attacks you for ${playerDamageReceived} damage!`;

        if (this.player.health <= 0) {
            battleText += `\n\n💀 **You have been defeated!**`;
            return { result: 'defeat', battleText };
        }

        return { result: 'continue', battleText };
    }

    async handleVictory() {
        // Award combat XP
        const xpGain = Math.floor(Math.random() * 10) + 5;
        await db.add(`combatxp_${this.userId}`, xpGain);

        // Award money if enemy has value
        if (this.enemy.value > 0) {
            await db.add(`money_${this.userId}`, this.enemy.value);
        }

        return {
            xp: xpGain,
            money: this.enemy.value
        };
    }

    async handleDefeat() {
        // Set player health to 1 to prevent actual death in quests
        await db.set(`health_${this.userId}`, 1);
        return `💀 You have been defeated! Your health has been reduced to 1.`;
    }

    async getBestWeapon() {
        const weapons = [
            { id: 'knife', name: 'Knife', damage: 2 },
            { id: 'sword', name: 'Sword', damage: 5 },
            { id: 'pistol', name: 'Pistol', damage: 8 },
            { id: 'shotgun', name: 'Shotgun', damage: 12 },
            { id: 'rifle', name: 'Rifle', damage: 15 }
        ];

        let bestWeapon = { name: "Fists", damage: 0 };
        
        for (const weapon of weapons) {
            const count = await db.get(`${weapon.id}_${this.userId}`) || 0;
            if (count > 0 && weapon.damage > bestWeapon.damage) {
                bestWeapon = weapon;
            }
        }
        
        return bestWeapon;
    }

    async getBestArmor() {
        const armors = [
            { id: 'leather', name: 'Leather Armor', defense: 1 },
            { id: 'chainmail', name: 'Chainmail Armor', defense: 2 },
            { id: 'platemail', name: 'Platemail Armor', defense: 3 },
            { id: 'dragonscale', name: 'Dragonscale Armor', defense: 5 }
        ];

        let bestArmor = { name: "No Armor", defense: 0 };
        
        for (const armor of armors) {
            const count = await db.get(`${armor.id}_${this.userId}`) || 0;
            if (count > 0 && armor.defense > bestArmor.defense) {
                bestArmor = armor;
            }
        }
        
        return bestArmor;
    }
}

function create(userId, questType) {
    return new SimpleCombat(userId, questType);
}

// Static utility method for safe interaction updates
async function updateInteractionSafely(interaction, options) {
    try {
        if (interaction.replied) {
            return await interaction.editReply(options);
        } else if (interaction.deferred) {
            return await interaction.editReply(options);
        } else {
            await interaction.deferUpdate();
            return await interaction.editReply(options);
        }
    } catch (error) {
        console.error('Error updating interaction safely:', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                return await interaction.reply({ ...options, ephemeral: true });
            }
        } catch (fallbackError) {
            console.error('Fallback interaction update failed:', fallbackError);
        }
    }
}

module.exports = {
    SimpleCombat,
    COMBAT_PRESETS,
    create,
    updateInteractionSafely
};