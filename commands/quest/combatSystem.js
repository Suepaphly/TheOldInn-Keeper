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
        // Get player stats
        const combatLevel = await db.get(`combatlevel_${this.userId}`) || 0;
        const health = await db.get(`health_${this.userId}`) || 100;

        this.player = {
            name: "You",
            health: health,
            maxHealth: health,
            damage: 5 + combatLevel,
            defense: 0
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
}

function create(userId, questType) {
    return new SimpleCombat(userId, questType);
}

module.exports = {
    SimpleCombat,
    COMBAT_PRESETS,
    create
};