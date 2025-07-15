const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const CombatSystem = require('./combatSystem.js');
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
    badlands: {
        name: "Ancient Red Dragon",
        color: "red",
        crystal: "Red Crystal", 
        specialMove: "Melt",
        specialDescription: "destroys a random item in your backpack"
    },
    wastelands: {
        name: "Ancient Blue Dragon",
        color: "blue",
        crystal: "Blue Crystal",
        specialMove: "Freeze", 
        specialDescription: "you skip your next turn"
    },
    highlands: {
        name: "Ancient Green Dragon",
        color: "green",
        crystal: "Green Crystal",
        specialMove: "Heal",
        specialDescription: "heals the dragon for 2-8 health"
    }
};

class TiamatCombatSystem extends CombatSystem.SimpleCombat {
    constructor(userId) {
        super(userId, 'tiamat');
        this.playerFrozen = false;
    }

    createCombatEmbed(battleText = "") {
        if (!this.player || !this.enemy) throw new Error("Tiamat combat not initialized");

        const embed = new EmbedBuilder()
            .setTitle(`🌟 ULTIMATE BOSS - TIAMAT, MOTHER OF DRAGONS`)
            .setColor("#4B0082")
            .setDescription(battleText || "The five-headed dragon goddess prepares her devastating assault!")
            .addFields(
                { name: "Your Health", value: `${this.player.health}/${this.player.maxHealth} HP`, inline: true },
                { name: "Your Weapon", value: this.player.weapon.name, inline: true },
                { name: "Your Armor", value: this.player.armor.name, inline: true },
                { name: "Tiamat's Health", value: `${this.enemy.health}/${this.enemy.maxHealth} HP`, inline: true },
                { name: "Dragon Heads", value: "⚪ White ⚫ Black 🔴 Red 🔵 Blue 🟢 Green", inline: true },
                { name: "Abilities", value: "Tax, Death, Melt, Freeze, Heal + Breath Weapons", inline: true }
            );

        let row;
        if (this.playerFrozen) {
            embed.addFields({ name: "❄️ Status", value: "You are frozen and must skip this turn!", inline: false });

            row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('tiamat_skip_turn')
                        .setLabel('❄️ Skip Turn (Frozen)')
                        .setStyle(ButtonStyle.Secondary)
                );
        } else {
            row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('tiamat_attack')
                        .setLabel('⚔️ Attack')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('tiamat_run')
                        .setLabel('🏃 Run Away')
                        .setStyle(ButtonStyle.Secondary)
                );
        }

        return { embed, row };
    }

    async processCombatRound() {
        if (!this.player || !this.enemy) return null;

        // If player is frozen, unfreeze them for next turn but Tiamat gets free attack
        if (this.playerFrozen) {
            this.playerFrozen = false;

            // Tiamat gets a free attack
            const abilities = ['breath', 'tax', 'death', 'melt', 'freeze', 'heal'];
            const chosenAbility = abilities[Math.floor(Math.random() * abilities.length)];
            let battleText = "You shake off the frost and can act again!\n";

            if (chosenAbility === 'breath') {
                // Breath weapon attack (8-15 damage - stronger than regular dragons)
                const breathDamage = Math.floor(Math.random() * 8) + 8; // 8-15 damage
                const finalBreathDamage = Math.max(1, breathDamage - this.player.armor.defense);
                this.player.health -= finalBreathDamage;
                this.player.health = Math.max(0, this.player.health);

                battleText += `Tiamat takes advantage of your recovery and unleashes a devastating breath attack for ${finalBreathDamage} damage!`;
            } else {
                const specialResult = await this.executeSpecialMove(chosenAbility);
                battleText += `Tiamat seizes the opportunity! ${specialResult}`;
            }

            // Check if player died from the free attack
            if (this.player.health <= 0) {
                return {
                    result: 'defeat',
                    battleText: battleText
                };
            }

            return {
                result: 'continue',
                battleText: battleText
            };
        }

        // Player attacks first - use the same logic as base SimpleCombat class
        const { hasCrystal } = require('../../utility/crystalUtils.js');
        const hasRedCrystal = await hasCrystal(this.userId, 'red');
        const redCrystalAttackBonus = hasRedCrystal ? 2 : 0;
        
        const baseDamage = 1 + (this.player.combatLevel || 0) + redCrystalAttackBonus;
        let weaponDamage = 0;
        
        if (this.player.weapon.minDamage !== undefined && this.player.weapon.maxDamage !== undefined) {
            const minDmg = this.player.weapon.minDamage || 0;
            const maxDmg = this.player.weapon.maxDamage || 0;
            weaponDamage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
        }
        
        const playerTotalDamage = baseDamage + weaponDamage;
        const enemyDefense = this.enemy.defense || 0;
        const playerFinalDamage = Math.max(1, playerTotalDamage - enemyDefense);

        // Apply damage to Tiamat
        this.enemy.health = Math.max(0, this.enemy.health - playerFinalDamage);

        let battleText = `You strike Tiamat for ${playerFinalDamage} damage!`;

        // Check if Tiamat is defeated
        if (this.enemy.health <= 0) {
            return {
                result: 'victory',
                battleText: battleText
            };
        }

        // Tiamat attacks - randomly choose from all abilities (breath weapons + all 5 special moves)
        const abilities = ['breath', 'tax', 'death', 'melt', 'freeze', 'heal'];
        const chosenAbility = abilities[Math.floor(Math.random() * abilities.length)];

        if (chosenAbility === 'breath') {
            // Breath weapon attack (8-15 damage - stronger than regular dragons)
            const breathDamage = Math.floor(Math.random() * 8) + 8; // 8-15 damage
            const finalBreathDamage = Math.max(1, breathDamage - this.player.armor.defense);
            this.player.health -= finalBreathDamage;
            this.player.health = Math.max(0, this.player.health);

            battleText += `\nTiamat's five heads unleash a devastating breath attack for ${finalBreathDamage} damage!`;
        } else {
            const specialResult = await this.executeSpecialMove(chosenAbility);
            battleText += `\n${specialResult}`;
        }

        // Check if player died
        if (this.player.health <= 0) {
            return {
                result: 'defeat',
                battleText: battleText
            };
        }

        // Combat continues
        return {
            result: 'continue',
            battleText: battleText
        };
    }

    async executeSpecialMove(ability) {
        switch (ability) {
            case 'tax': // White head - Tax
                const currentMoney = await db.get(`money_${this.userId}`) || 0;
                const stolen = Math.floor(currentMoney * 0.1);
                if (stolen > 0) {
                    await db.sub(`money_${this.userId}`, stolen);
                    return `Tiamat's white head casts Tax! It steals ${stolen} kopeks from your wallet!`;
                } else {
                    return `Tiamat's white head casts Tax, but you have no money to steal!`;
                }

            case 'death': // Black head - Death
                if (Math.random() < 0.1) { // 10% chance
                    this.player.health = 0;
                    return `Tiamat's black head casts Death! You feel your life force drain away instantly!`;
                } else {
                    return `Tiamat's black head casts Death, but you resist its dark magic!`;
                }

            case 'melt': // Red head - Melt
                const items = await this.getBackpackItems();
                if (items.length > 0) {
                    const randomItem = items[Math.floor(Math.random() * items.length)];
                    await db.sub(randomItem.key, 1);
                    return `Tiamat's red head casts Melt! Your ${randomItem.name} is destroyed by the intense heat!`;
                } else {
                    return `Tiamat's red head casts Melt, but you have no items to destroy!`;
                }

            case 'freeze': // Blue head - Freeze
                this.playerFrozen = true;
                return `Tiamat's blue head casts Freeze! You are encased in ice and will skip your next turn!`;

            case 'heal': // Green head - Heal
                const healAmount = Math.floor(Math.random() * 7) + 2; // 2-8 healing
                this.enemy.health = Math.min(this.enemy.maxHealth, this.enemy.health + healAmount);
                return `Tiamat's green head casts Heal! She recovers ${healAmount} health!`;

            default:
                return `Tiamat uses an unknown special move!`;
        }
    }

    async getBackpackItems() {
        const items = [];

        try {
            // Get all weapons (matching main combat system)
            const weapons = ['knife', 'sword', 'pistol', 'shotgun', 'rifle'];
            for (const weapon of weapons) {
                const count = await db.get(`weapon_${weapon}_${this.userId}`) || 0;
                if (count > 0) {
                    items.push({ 
                        key: `weapon_${weapon}_${this.userId}`, 
                        name: weapon, 
                        type: 'weapon',
                        count: count 
                    });
                }
            }

            // Get all armor (excluding dragonscale - it's protected)
            const armors = ['cloth', 'leather', 'chainmail', 'studded', 'plate'];
            for (const armor of armors) {
                const count = await db.get(`armor_${armor}_${this.userId}`) || 0;
                if (count > 0) {
                    items.push({ 
                        key: `armor_${armor}_${this.userId}`, 
                        name: `${armor} armor`, 
                        type: 'armor',
                        count: count 
                    });
                }
            }

            // Don't include crystals - they are protected from destruction
        } catch (error) {
            console.error('Error getting backpack items:', error);
        }

        return items;
    }

    async handleVictory() {
        // Check if this is debug mode
        const { activeQuests } = require('../quest.js');
        const quest = activeQuests.get(this.userId);
        if (quest && quest.data && (quest.data.isDebug || quest.data.debugDragon)) {
            return `🔧 **DEBUG VICTORY!** 🔧\n\nYou have achieved the impossible - slaying Tiamat, the Mother of Dragons! In normal mode, you would receive 100,000 kopeks and Dragonscale Armor (sells for 6,000 kopeks), and all crystals would be removed from your inventory.\n\n*Debug mode - no actual rewards given or crystals removed.*`;
        }

        const kopeksReward = 100000;
        const dragonscaleArmorReward = 6000;

        await db.add(`money_${this.userId}`, kopeksReward);
        await db.add(`money_${this.userId}`, dragonscaleArmorReward);

        // Remove all crystals
        const crystals = ['white', 'black', 'red', 'blue', 'green'];
        for (const crystal of crystals) {
            await db.set(`crystal_${crystal}_${this.userId}`, 0);
        }

        // Set Tiamat daily cooldown (24 hours from now)
        const tomorrow = Date.now() + (24 * 60 * 60 * 1000);
        await db.set(`tiamat_cooldown_${this.userId}`, tomorrow);

        return `🌟 **LEGENDARY VICTORY!** 🌟\n\nYou have achieved the impossible - slaying Tiamat, the Mother of Dragons! As her five heads collapse, the very fabric of reality trembles. You are now a legend among legends, having conquered the ultimate draconic threat!\n\n*The other dragons across all realms bow their heads in respect for your incredible feat.*\n\nYou receive 100,000 kopeks and Dragonscale Armor (sells for 6,000 kopeks)! All crystals have been removed from your inventory.\n\n⏰ Tiamat can only be defeated once per day. You must wait 24 hours before facing her again.`;
    }

    async handleDefeat() {
        await db.set(`death_cooldown_${this.userId}`, Date.now());
        return `Tiamat, Mother of Dragons, has utterly defeated you! Your quest ends in legendary failure. The five-headed goddess reclaims her dominion. You are now dead for 24 hours.`;
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

        for (const armor of armors) {
            const count = await db.get(`armor_${armor.type}_${this.userId}`) || 0;
            if (count > 0) {
                return armor;
            }
        }

        return { type: "none", name: "No Armor", defense: 0 };
    }
}

class DragonCombatSystem extends CombatSystem.SimpleCombat {
    constructor(userId, location) {
        super(userId, 'dragon');
        this.location = location;
        this.dragon = dragonData[location];
        this.playerFrozen = false;
    }

    createCombatEmbed(battleText = "") {
        if (!this.enemy || !this.player) throw new Error("Dragon combat not initialized");

        const embed = new EmbedBuilder()
            .setTitle(`🐲 BOSS BATTLE - ${this.enemy.name}`)
            .setColor("#8B0000")
            .setDescription(battleText || "The ancient dragon prepares to strike!")
            .addFields(
                { name: "Your Health", value: `${this.player.health}/${this.player.maxHealth} HP`, inline: true },
                { name: "Your Weapon", value: this.player.weapon.name, inline: true },
                { name: "Your Armor", value: this.player.armor.name, inline: true },
                { name: "Dragon Health", value: `${this.enemy.health}/${this.enemy.maxHealth} HP`, inline: true },
                { name: "Dragon", value: this.enemy.name, inline: true },
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
        if (!this.enemy || !this.player) return null;

        // If player is frozen, unfreeze them for next turn but dragon gets free attack
        if (this.playerFrozen) {
            this.playerFrozen = false;

            // Dragon gets a free attack
            const useSpecialMove = Math.random() < 0.30; // 30% chance for special move
            let battleText = "You shake off the frost and can act again!\n";

            if (useSpecialMove) {
                const specialResult = await this.executeSpecialMove();
                battleText += specialResult;
            } else {
                // Breath weapon attack (6-12 damage)
                const breathDamage = Math.floor(Math.random() * 7) + 6; // 6-12 damage
                const finalBreathDamage = Math.max(1, breathDamage - this.player.armor.defense);
                this.player.health -= finalBreathDamage;
                this.player.health = Math.max(0, this.player.health);

                battleText += `The ${this.dragon.name} takes advantage of your recovery and unleashes its breath weapon for ${finalBreathDamage} damage!`;
            }

            // Check if player died from the free attack
            if (this.player.health <= 0) {
                return {
                    result: 'defeat',
                    battleText: battleText
                };
            }

            return {
                result: 'continue',
                battleText: battleText
            };
        }

        // Player attacks first using correct damage formula: 1 (Base) + (Combat Level) + (Weapon Roll)
        const baseDamage = 1 + (this.player.combatLevel || 0);
        let weaponDamage = 0;
        
        if (this.player.weapon.isDual) {
            // Dual pistols - two separate rolls
            const minDmg = this.player.weapon.minDamage || 0;
            const maxDmg = this.player.weapon.maxDamage || 0;
            const firstRoll = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
            const secondRoll = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
            weaponDamage = firstRoll + secondRoll;
        } else if (this.player.weapon.minDamage !== undefined && this.player.weapon.maxDamage !== undefined) {
            // Regular weapon with damage range
            const minDmg = this.player.weapon.minDamage || 0;
            const maxDmg = this.player.weapon.maxDamage || 0;
            weaponDamage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
        } else {
            // Fists or no weapon
            weaponDamage = 0;
        }
        
        const playerTotalDamage = baseDamage + weaponDamage;
        const enemyDefense = this.enemy.defense || 0;
        const playerFinalDamage = Math.max(1, playerTotalDamage - enemyDefense);

        // Apply damage to dragon
        this.enemy.health = Math.max(0, this.enemy.health - playerFinalDamage);

        let battleText = `You attack the ${this.dragon.name} for ${playerFinalDamage} damage!`;

        // Check if dragon is defeated
        if (this.enemy.health <= 0) {
            return {
                result: 'victory',
                battleText: battleText
            };
        }

        // Dragon attacks back - choose between breath weapon and special move
        const useSpecialMove = Math.random() < 0.30; // 30% chance for special move

        if (useSpecialMove) {
            const specialResult = await this.executeSpecialMove();
            battleText += `\n${specialResult}`;
        } else {
            // Breath weapon attack (6-12 damage)
            const breathDamage = Math.floor(Math.random() * 7) + 6; // 6-12 damage
            const finalBreathDamage = Math.max(1, breathDamage - this.player.armor.defense);
            this.player.health -= finalBreathDamage;
            this.player.health = Math.max(0, this.player.health);

            battleText += `\nThe ${this.dragon.name} unleashes its breath weapon for ${finalBreathDamage} damage!`;
        }

        // Check if player died
        if (this.player.health <= 0) {
            return {
                result: 'defeat',
                battleText: battleText
            };
        }

        // Combat continues
        return {
            result: 'continue',
            battleText: battleText
        };
    }

    async executeSpecialMove() {
        try {
            switch (this.location) {
                case 'plains': // White Dragon - Tax
                    const currentMoney = await db.get(`money_${this.userId}`) || 0;
                    const stolenAmount = Math.floor(currentMoney * 0.1);
                    if (stolenAmount > 0) {
                        await db.sub(`money_${this.userId}`, stolenAmount);
                        return `The White Dragon casts Tax! It steals ${stolenAmount} kopeks from your purse!`;
                    } else {
                        return `The White Dragon attempts to steal your coins, but you have nothing to take!`;
                    }

                case 'forest': // Black Dragon - Death
                    if (Math.random() < 0.1) { // 10% chance of instant death
                        this.player.health = 0;
                        return `The Black Dragon casts Death! You feel your life force drain away completely!`;
                    } else {
                        return `The Black Dragon casts Death, but you resist its dark magic!`;
                    }

                case 'badlands': // Red Dragon - Melt
                    const items = await this.getBackpackItems();
                    if (items.length > 0) {
                        const randomItem = items[Math.floor(Math.random() * items.length)];

                        if (!randomItem) {
                            return `The Red Dragon casts Melt, but no item could be found to melt!`;
                        }

                        await db.sub(randomItem.key, 1);
                        return `The Red Dragon casts Melt! Your ${randomItem.name} is destroyed by the intense heat!`;
                    } else {
                        return `The Red Dragon casts Melt, but you have no items to destroy!`;
                    }

                case 'wastelands': // Blue Dragon - Freeze
                    if (Math.random() < 0.7) { // 70% chance to freeze
                        this.playerFrozen = true;
                        return `The Blue Dragon casts Freeze! You are encased in ice and will skip your next turn!`;
                    } else {
                        return `The Blue Dragon attempts to freeze you, but you resist the icy magic!`;
                    }

                case 'highlands': // Green Dragon - Heal
                    const healAmount = Math.floor(Math.random() * 7) + 2; // 2-8 healing
                    this.enemy.health = Math.min(this.enemy.maxHealth, this.enemy.health + healAmount);
                    return `The Green Dragon casts Heal! It recovers ${healAmount} health!`;

                default:
                    return `The dragon uses an unknown special move!`;
            }
        } catch (error) {
            console.error('Error executing special move:', error);
            return `The dragon's special move failed due to an error!`;
        }
    }

    async getBackpackItems() {
        const items = [];

        try {
            // Get all weapons (matching main combat system)
            const weapons = ['knife', 'sword', 'pistol', 'shotgun', 'rifle'];
            for (const weapon of weapons) {
                const count = await db.get(`weapon_${weapon}_${this.userId}`) || 0;
                if (count > 0) {
                    items.push({ 
                        key: `weapon_${weapon}_${this.userId}`, 
                        name: weapon, 
                        type: 'weapon',
                        count: count 
                    });
                }
            }

            // Get all armor (excluding dragonscale - it's protected)
            const armors = ['cloth', 'leather', 'chainmail', 'studded', 'plate'];
            for (const armor of armors) {
                const count = await db.get(`armor_${armor}_${this.userId}`) || 0;
                if (count > 0) {
                    items.push({ 
                        key: `armor_${armor}_${this.userId}`, 
                        name: `${armor} armor`, 
                        type: 'armor',
                        count: count 
                    });
                }
            }

            // Don't include crystals - they are protected from destruction
        } catch (error) {
            console.error('Error getting backpack items:', error);
        }

        return items;
    }

    async handleVictory() {
        const dragon = this.dragon;

        // Check if this is debug mode
        const { activeQuests } = require('../quest.js');
        const quest = activeQuests.get(this.userId);
        if (quest && quest.data && (quest.data.isDebug || quest.data.debugDragon)) {
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

async function startTiamatBattle(interaction, userId, activeQuests) {
    // Check if Tiamat is on cooldown
    const tiamatCooldown = await db.get(`tiamat_cooldown_${userId}`);
    if (tiamatCooldown && Date.now() < tiamatCooldown) {
        const timeRemaining = tiamatCooldown - Date.now();
        const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));

        const embed = new EmbedBuilder()
            .setTitle("⏰ Tiamat is Recovering")
            .setColor("#FF6600")
            .setDescription(`Tiamat, Mother of Dragons, is still recovering from your previous battle. She can only be challenged once per day.\n\nTime remaining: ${hoursRemaining} hours`);

        await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [] });
        return;
    }

    // Create a new quest for Tiamat battle
    const questData = {
        location: 'tiamat_realm',
        startTime: Date.now(),
        questsCompleted: 0,
        totalMonsterValue: 0,
        currentQuest: 'tiamat',
        isDebug: false
    };

    activeQuests.set(userId, questData);
    await db.set(`on_quest_${userId}`, true);

    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;

    // Create Tiamat combat system
    const tiamatCombat = new TiamatCombatSystem(userId);

    // Initialize combat with Tiamat stats
    const tiamatStats = {
        name: "Tiamat, Mother of Dragons",
        health: 100,
        maxHealth: 100,
        damage: 10, // Base damage for breath attacks
        defense: 3,
        value: 0
    };

    // Initialize combat first before creating embed
    await tiamatCombat.initializeCombat({}, tiamatStats);

    // Store combat instance in quest data
    quest.data = quest.data || {};
    quest.data.combat = tiamatCombat;

    // Now create the combat embed after initialization
    const { embed, row } = tiamatCombat.createCombatEmbed("The Mother of Dragons spreads her mighty wings and prepares to unleash devastation!");
    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

    // Set up Tiamat combat collector
    const filter = (i) => i.user.id === userId;

    let message;
    try {
        if (interaction.replied || interaction.deferred) {
            message = await interaction.fetchReply();
        } else {
            message = interaction.message;
        }
    } catch (error) {
        console.error('Error getting message for Tiamat combat collector:', error);
        return;
    }

    const collector = message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleTiamatCombat(i, userId, collector, activeQuests);
    });
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

async function handleTiamatCombat(interaction, userId, collector, activeQuests) {
    const { endQuest, completeQuest } = require('../quest.js');
    const quest = activeQuests.get(userId);
    if (!quest || !quest.data.combat) return;

    const tiamatCombat = quest.data.combat;

    if (interaction.customId === 'tiamat_run') {
        await endQuest(interaction, userId, false, "You fled from Tiamat! Your quest ends in cowardly retreat from the Mother of Dragons.", activeQuests);
        collector.stop();
        return;
    }

    if (interaction.customId === 'tiamat_skip_turn') {
        // Player skips turn due to freeze
        const combatResult = await tiamatCombat.processCombatRound();

        if (combatResult && combatResult.result === 'continue') {
            const { embed, row } = tiamatCombat.createCombatEmbed(combatResult.battleText);
            await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
        }
        return;
    }

    if (interaction.customId === 'tiamat_attack') {
        try {
            const combatResult = await tiamatCombat.processCombatRound();

            if (combatResult.result === 'victory') {
                const victoryMessage = await tiamatCombat.handleVictory();
                await completeQuest(interaction, userId, 1000, activeQuests);
                collector.stop();
            } else if (combatResult.result === 'defeat') {
                const defeatMessage = await tiamatCombat.handleDefeat();
                await endQuest(interaction, userId, false, defeatMessage, activeQuests);
                collector.stop();
            } else {
                // Combat continues
                const { embed, row } = tiamatCombat.createCombatEmbed(combatResult.battleText);
                await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
            }
        } catch (error) {
            console.error('Error in Tiamat combat:', error);
            await endQuest(interaction, userId, false, "An error occurred during the battle with Tiamat. Your quest ends.", activeQuests);
            collector.stop();
        }
    }
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
                await completeQuest(interaction, userId, 500, activeQuests);
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
    startTiamatBattle,
    DragonCombatSystem,
    TiamatCombatSystem
};