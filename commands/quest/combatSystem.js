const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

class CombatSystem {
    constructor(userId, combatType = 'default') {
        this.userId = userId;
        this.combatType = combatType;
        this.combatData = null;
    }

    async initializeCombat(playerData, enemyData) {
        const combatLevel = await db.get(`combatlevel_${this.userId}`) || 0;

        this.combatData = {
            // Player stats
            playerHealth: playerData.health || (5 + (combatLevel * 2)),
            playerMaxHealth: playerData.maxHealth || (5 + (combatLevel * 2)),
            playerWeapon: playerData.weapon || await this.getBestWeapon(),
            playerArmor: playerData.armor || await this.getBestArmor(),
            combatLevel: combatLevel,

            // Enemy stats
            enemyName: enemyData.name || "Unknown Enemy",
            enemyHealth: enemyData.health,
            enemyMaxHealth: enemyData.maxHealth || enemyData.health,
            enemyDamage: enemyData.damage,
            enemyDefense: enemyData.defense || 0,
            enemyValue: enemyData.value || 0,

            // Combat state
            round: 0,
            isActive: true
        };

        return this.combatData;
    }

    createCombatEmbed(battleText = "") {
        if (!this.combatData) throw new Error("Combat not initialized");

        const titles = {
            monster: `⚔️ AMBUSH - ${this.combatData.enemyName}`,
            vengeance: `⚔️ VENGEANCE COMBAT - Round ${this.combatData.round}`,
            maze: `🌿 HEDGE MAZE - VINE BEAST COMBAT - Round ${this.combatData.round}`,
            default: `⚔️ COMBAT - Round ${this.combatData.round}`
        };

        const title = titles[this.combatType] || titles.default;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor("#FF0000")
            .setDescription(battleText || "The battle continues!")
            .addFields(
                { name: "Your Health", value: `${this.combatData.playerHealth}/${this.combatData.playerMaxHealth} HP`, inline: true },
                { name: "Your Weapon", value: this.combatData.playerWeapon.name, inline: true },
                { name: "Your Armor", value: this.combatData.playerArmor.name, inline: true },
                { name: "Enemy Health", value: `${this.combatData.enemyHealth}/${this.combatData.enemyMaxHealth} HP`, inline: true },
                { name: "Enemy", value: this.combatData.enemyName, inline: true }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`${this.combatType}_attack`)
                    .setLabel('⚔️ Attack')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`${this.combatType}_run`)
                    .setLabel('🏃 Run Away')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embed, row };
    }

    async processCombatRound() {
        if (!this.combatData || !this.combatData.isActive) return null;

        this.combatData.round++;

        // Player attacks first
        const playerCombatDamage = this.combatData.combatLevel + 1;
        const playerWeaponDamage = Math.floor(Math.random() * 
            (this.combatData.playerWeapon.maxDamage - this.combatData.playerWeapon.minDamage + 1)) + 
            this.combatData.playerWeapon.minDamage;
        const playerTotalDamage = playerCombatDamage + playerWeaponDamage;
        const playerFinalDamage = Math.max(1, playerTotalDamage - this.combatData.enemyDefense);

        // Apply damage to enemy
        this.combatData.enemyHealth -= playerFinalDamage;
        this.combatData.enemyHealth = Math.max(0, this.combatData.enemyHealth);

        let battleText = `You attack for ${playerFinalDamage} damage!`;

        // Check if enemy is defeated
        if (this.combatData.enemyHealth <= 0) {
            this.combatData.isActive = false;
            return {
                result: 'victory',
                battleText: battleText,
                combatData: this.combatData
            };
        }

        // Enemy attacks back
        const enemyFinalDamage = Math.max(1, this.combatData.enemyDamage - this.combatData.playerArmor.defense);
        this.combatData.playerHealth -= enemyFinalDamage;
        this.combatData.playerHealth = Math.max(0, this.combatData.playerHealth);

        battleText += `\nThe ${this.combatData.enemyName} retaliates for ${enemyFinalDamage} damage!`;

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

    async handleVictory() {
        if (!this.combatData) return null;

        const rewards = {
            money: 0,
            items: []
        };

        // Calculate rewards based on combat type and enemy value
        if (this.combatData.enemyValue > 0) {
            rewards.money = this.combatData.enemyValue;
        }

        // Special rewards for specific combat types
        if (this.combatType === 'vengeance') {
            rewards.money = 25;
            rewards.items.push({ type: 'weapon_pistol', amount: 1, name: 'pistol' });
            await db.add(`money_${this.userId}`, rewards.money);
            await db.add(`weapon_pistol_${this.userId}`, 1);
        } else if (rewards.money > 0) {
            await db.add(`money_${this.userId}`, rewards.money);
        }

        return rewards;
    }

    async handleDefeat() {
        // Handle death for specific combat types
        const deathMessages = {
            vengeance: "You were killed by the vengeful relative! Your quest ends in tragedy.",
            maze: "You were defeated by the vine beast! Your quest ends in failure.",
            riddle: "The ancient sphinx devours you for your ignorance!",
            default: "You were defeated in combat!"
        };

        return deathMessages[this.combatType] || deathMessages.default;
    }

    async getBestWeapon() {
        const weapons = [
            { type: "rifle", name: "Rifle", minDamage: 6, maxDamage: 12 },
            { type: "shotgun", name: "Shotgun", minDamage: 4, maxDamage: 10 },
            { type: "pistol", name: "Pistol", minDamage: 3, maxDamage: 5 },
            { type: "sword", name: "Sword", minDamage: 2, maxDamage: 4 },
            { type: "knife", name: "Knife", minDamage: 1, maxDamage: 3 }
        ];

        for (const weapon of weapons) {
            const count = await db.get(`weapon_${weapon.type}_${this.userId}`) || 0;
            if (count > 0) {
                return weapon;
            }
        }

        return { type: "none", name: "Fists", minDamage: 0, maxDamage: 0 };
    }

    async getBestArmor() {
        const armors = [
            { type: "plate", name: "Plate Armor", defense: 10 },
            { type: "studded", name: "Studded Armor", defense: 5 },
            { type: "chainmail", name: "Chainmail Armor", defense: 3 },
            { type: "leather", name: "Leather Armor", defense: 2 },
            { type: "cloth", name: "Cloth Armor", defense: 1 }
        ];

        for (const armor of armors) {
            const count = await db.get(`armor_${armor.type}_${this.userId}`) || 0;
            if (count > 0) {
                return armor;
            }
        }

        return { type: "none", name: "No Armor", defense: 0 };
    }

    // Static method to create combat instances
    static create(userId, combatType = 'default') {
        return new CombatSystem(userId, combatType);
    }

    // Static method for updating interactions safely
    static async updateInteractionSafely(interaction, options) {
        try {
            if (interaction.replied || interaction.deferred) {
                return await interaction.editReply(options);
            } else {
                return await interaction.update(options);
            }
        } catch (error) {
            if (error.code === 10062 || error.code === 'InteractionNotReplied') {
                try {
                    // Try to defer first, then edit
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.deferUpdate();
                        return await interaction.editReply(options);
                    } else {
                        return await interaction.followUp(options);
                    }
                } catch (fallbackError) {
                    // Last resort - try to send a new message to the channel if possible
                    if (interaction.channel) {
                        try {
                            return await interaction.channel.send(options);
                        } catch (channelError) {
                            console.error('All interaction methods failed:', channelError.message);
                        }
                    }
                    throw fallbackError;
                }
            } else {
                throw error;
            }
        }
    }
}

// Combat presets for different enemy types
const COMBAT_PRESETS = {
    goblinScout: (combatLevel) => ({
        name: "Goblin Scout",
        health: Math.floor((5 + (combatLevel * 2)) * 0.8) + 5,
        damage: Math.floor((1 + combatLevel) * 0.7) + 2,
        defense: Math.floor(combatLevel * 0.5),
        value: 25
    }),

    orcRaider: (combatLevel) => ({
        name: "Orc Raider",
        health: Math.floor((5 + (combatLevel * 2)) * 1.2) + 5,
        damage: Math.floor((1 + combatLevel) * 1.0) + 2,
        defense: Math.floor(combatLevel * 0.8),
        value: 40
    }),

    vineBeast: (combatLevel) => ({
        name: "Vine Beast",
        health: 15 + (combatLevel * 3),
        damage: 3 + combatLevel,
        defense: Math.floor(combatLevel * 0.5),
        value: 0
    }),

    vengeanceEnemy: () => ({
        name: "Vengeful Relative",
        health: 7,
        damage: 4,
        defense: 0,
        value: 0
    })
};

module.exports = {
    CombatSystem,
    COMBAT_PRESETS
};