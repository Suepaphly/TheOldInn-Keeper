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

        // Check for red crystal bonus
        const { hasCrystal } = require('../../utility/crystalUtils.js');
        const hasRedCrystal = await hasCrystal(this.userId, 'red');
        const redCrystalHealthBonus = hasRedCrystal ? 4 : 0;

        // Calculate health using formula: 5 (Base) + (Combat Lvl * 2) + (Red crystal bonus if applicable)
        const calculatedHealth = 5 + (combatLevel * 2) + redCrystalHealthBonus;

        // Get equipped weapon and armor
        const equippedWeapon = await this.getBestWeapon();
        const equippedArmor = await this.getBestArmor();

        // Calculate defense from armor
        const armorDefense = equippedArmor.defense || 0;

        this.player = {
            name: "You",
            health: calculatedHealth,
            maxHealth: calculatedHealth,
            combatLevel: combatLevel,
            defense: armorDefense,
            weapon: equippedWeapon,
            armor: equippedArmor
        };

        // Ensure enemy data has all required properties with defaults
        this.enemy = {
            name: enemyData.name || "Unknown Enemy",
            health: enemyData.health || 10,
            maxHealth: enemyData.maxHealth || enemyData.health || 10,
            damage: enemyData.damage || 1,
            defense: enemyData.defense || 0,
            value: enemyData.value || 0
        };
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
                { name: "Your Weapon", value: this.player.weapon.minDamage ? `${this.player.weapon.name} (${this.player.weapon.minDamage}-${this.player.weapon.maxDamage} damage)` : `${this.player.weapon.name}`, inline: true },
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
        // Player attacks first using correct damage formula: 1 (Base) + (Combat Level) + (Weapon Roll) + (Red crystal bonus)
        const { hasCrystal } = require('../../utility/crystalUtils.js');
        const hasRedCrystal = await hasCrystal(this.userId, 'red');
        const redCrystalAttackBonus = hasRedCrystal ? 2 : 0;
        
        const baseDamage = 1 + (this.player.combatLevel || 0) + redCrystalAttackBonus;
        let weaponDamage = 0;
        let attackDescription = "";

        // Check for dual pistols (Guns Akimbo feat)
        const hasGunsAkimbo = await db.get(`feat_guns_akimbo_${this.userId}`) || false;
        const pistolCount = await db.get(`weapon_pistol_${this.userId}`) || 0;
        
        if (hasGunsAkimbo && pistolCount >= 2 && this.player.weapon.name === "Dual Pistols") {
            // Dual pistols - two separate rolls like in attackplayer.js
            const firstWeaponDamage = Math.floor(Math.random() * (5 - 3 + 1)) + 3; // 3-5 damage
            const secondWeaponDamage = Math.floor(Math.random() * (5 - 3 + 1)) + 3; // 3-5 damage
            weaponDamage = firstWeaponDamage + secondWeaponDamage;
            attackDescription = ` with dual pistols (${firstWeaponDamage} + ${secondWeaponDamage})`;
        } else if (this.player.weapon.minDamage !== undefined && this.player.weapon.maxDamage !== undefined) {
            // Regular weapon with damage range
            const minDmg = this.player.weapon.minDamage || 0;
            const maxDmg = this.player.weapon.maxDamage || 0;
            weaponDamage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
            attackDescription = ` with ${this.player.weapon.name}`;
        } else {
            // Fists or no weapon
            weaponDamage = 0;
            attackDescription = ` with fists`;
        }

        const totalPlayerDamage = baseDamage + weaponDamage;
        const enemyDefense = this.enemy.defense || 0;
        const damageDealt = Math.max(1, totalPlayerDamage - enemyDefense);
        this.enemy.health = Math.max(0, this.enemy.health - damageDealt);

        let battleText = `You attack${attackDescription} for ${damageDealt} damage!`;

        if (this.enemy.health <= 0) {
            battleText += `\n\n🎉 **${this.enemy.name} defeated!**`;
            await this.handleVictory();
            return { result: 'victory', battleText };
        }

        // Enemy attacks
        const enemyBaseDamage = this.enemy.damage || 1;
        const variation = Math.floor(Math.random() * 4) - 2; // -2 to +1 variation
        const enemyDamage = Math.max(1, enemyBaseDamage + variation);
        const playerDefense = this.player.defense || 0;
        const playerDamageReceived = Math.max(1, enemyDamage - playerDefense);
        this.player.health = Math.max(0, this.player.health - playerDamageReceived);

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
        // In quests, defeat should end the quest without setting health
        return `💀 You have been defeated in combat!`;
    }

    async getBestWeapon() {
        const weapons = [
            { type: "rifle", name: "Rifle", minDamage: 6, maxDamage: 12 },
            { type: "shotgun", name: "Shotgun", minDamage: 4, maxDamage: 10 },
            { type: "pistol", name: "Pistol", minDamage: 3, maxDamage: 5 },
            { type: "sword", name: "Sword", minDamage: 2, maxDamage: 4 },
            { type: "knife", name: "Knife", minDamage: 1, maxDamage: 3 }
        ];

        // Check for dual pistols first (Guns Akimbo feat) - matches attackplayer.js logic
        const hasGunsAkimbo = await db.get(`feat_guns_akimbo_${this.userId}`) || false;
        const pistolCount = await db.get(`weapon_pistol_${this.userId}`) || 0;

        if (hasGunsAkimbo && pistolCount >= 2) {
            // Check if dual pistols are the best weapon by comparing max potential damage
            const dualPistolMaxDamage = 5 * 2; // 5 max damage per pistol * 2 pistols

            // Check if any better weapon exists
            const rifleCount = await db.get(`weapon_rifle_${this.userId}`) || 0;
            const shotgunCount = await db.get(`weapon_shotgun_${this.userId}`) || 0;

            if (rifleCount === 0 && shotgunCount === 0) {
                return { 
                    type: "pistol", 
                    name: "Dual Pistols", 
                    minDamage: 3, 
                    maxDamage: 5
                };
            }
        }

        // Check weapons in priority order (like attackplayer.js)
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
            { type: "dragonscale", name: "Dragonscale Armor", defense: 20 },
            { type: "plate", name: "Plate Armor", defense: 10 },
            { type: "studded", name: "Studded Armor", defense: 5 },
            { type: "chainmail", name: "Chainmail Armor", defense: 3 },
            { type: "leather", name: "Leather Armor", defense: 2 },
            { type: "cloth", name: "Cloth Armor", defense: 1 }
        ];

        // Check armors in priority order (like attackplayer.js)
        for (const armor of armors) {
            const count = await db.get(`armor_${armor.type}_${this.userId}`) || 0;
            if (count > 0) {
                return armor;
            }
        }

        return { type: "none", name: "No Armor", defense: 0 };
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