const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

const trolleyScenarios = [
    { many: "5 grandmothers", one: "1 judge" },
    { many: "5 old men", one: "1 baby" },
    { many: "3 doctors", one: "1 criminal" },
    { many: "4 teachers", one: "1 student" },
    { many: "5 strangers", one: "1 friend" },
    { many: "3 children", one: "1 elderly person" },
    { many: "4 workers", one: "1 CEO" },
    { many: "5 tourists", one: "1 local" },
    { many: "2 philosophers", one: "1 scientist" },
    { many: "6 prisoners", one: "1 guard" },
    { many: "3 musicians", one: "1 deaf person" },
    { many: "4 athletes", one: "1 disabled person" },
    { many: "5 rich people", one: "1 poor person" },
    { many: "2 engineers", one: "1 artist" },
    { many: "4 soldiers", one: "1 pacifist" },
    { many: "3 lawyers", one: "1 honest person" },
    { many: "5 adults", one: "1 teenager" },
    { many: "2 twins", one: "1 only child" },
    { many: "4 doctors", one: "1 patient" },
    { many: "3 firefighters", one: "1 arsonist" },
    { many: "5 teachers", one: "1 dropout" },
    { many: "2 parents", one: "1 orphan" },
    { many: "6 voters", one: "1 politician" },
    { many: "3 police officers", one: "1 criminal" },
    { many: "4 chefs", one: "1 food critic" },
    { many: "5 workers", one: "1 robot" },
    { many: "2 identical twins", one: "1 triplet" },
    { many: "3 honest people", one: "1 liar" },
    { many: "6 strangers", one: "1 family member" },
    { many: "4 healthy people", one: "1 sick person" },
    { many: "3 students", one: "1 professor" },
    { many: "5 employees", one: "1 boss" },
    { many: "2 competitors", one: "1 teammate" },
    { many: "4 villains", one: "1 hero" },
    { many: "3 pessimists", one: "1 optimist" },
    { many: "5 humans", one: "1 alien" },
    { many: "2 enemies", one: "1 ally" },
    { many: "4 conservatives", one: "1 liberal" }
];

async function startTrolleyQuest(interaction, userId, activeQuests) {
    const scenario = trolleyScenarios[Math.floor(Math.random() * trolleyScenarios.length)];

    const quest = activeQuests.get(userId);
    quest.data = {
        scenario: scenario,
        choice: null
    };

    const embed = new EmbedBuilder()
        .setTitle("🚃 THE TROLLEY PROBLEM")
        .setColor("#696969")
        .setDescription(`You come upon a runaway trolley heading toward **${scenario.many}** tied to the tracks.\n\nYou can pull a lever to divert it to another track... but there's **${scenario.one}** tied to that track.\n\n**Do you pull the lever to save ${scenario.many} by sacrificing ${scenario.one}?**`)
        .addFields(
            { name: "The Choice", value: "There is no right answer. You must live with whatever you choose.", inline: false }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('trolley_pull')
                .setLabel('🔄 Pull the Lever')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('trolley_walk')
                .setLabel('🚶 Walk Away')
                .setStyle(ButtonStyle.Secondary)
        );

    try {
        // Check if interaction has already been replied to or deferred
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

    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        if (i.customId === 'trolley_continue') {
            const { completeQuest } = require('../quest.js');
            await completeQuest(i, userId, activeQuests);
            collector.stop();
            return;
        }

        if (i.customId === 'trolley_vengeance_continue') {
            const { completeQuest } = require('../quest.js');
            await completeQuest(i, userId, activeQuests);
            collector.stop();
            return;
        }

        let choice;
        let shouldTriggerVengeance = false;

        if (i.customId === 'trolley_pull') {
            choice = `You pulled the lever. ${scenario.one} died to save ${scenario.many}. The weight of this choice will stay with you forever.`;
            quest.data.choice = 'pull';

            // 50% chance of vengeance
            if (Math.random() < 0.5) {
                shouldTriggerVengeance = true;
            }
        } else {
            choice = `You walked away. ${scenario.many} died while you did nothing. Sometimes inaction is also a choice.`;
            quest.data.choice = 'walk';
        }

        if (shouldTriggerVengeance) {
            // Start vengeance combat
            const embed = new EmbedBuilder()
                .setTitle("🚃 THE TROLLEY PROBLEM - VENGEANCE")
                .setColor("#8B0000")
                .setDescription(`${choice}\n\n**Suddenly, a relative of the deceased appears!**\n\n*"You killed my family! I will have my revenge!"*\n\nThey draw a pistol and attack you!`)
                .addFields(
                    { name: "⚔️ Combat", value: "You must fight for your life!", inline: false }
                );

            try {
                await i.update({ embeds: [embed], components: [] });
            } catch (error) {
                if (error.code === 10062) {
                    await i.followUp({ embeds: [embed], components: [] });
                } else {
                    console.error('Error updating interaction:', error);
                    throw error;
                }
            }

            // Set up vengeance combat after a delay
            setTimeout(() => {
                startVengeanceCombat(i, userId, collector, activeQuests);
            }, 3000);
        } else {
            // Normal continue
            const embed = new EmbedBuilder()
                .setTitle("🚃 THE TROLLEY PROBLEM - CHOICE MADE")
                .setColor("#696969")
                .setDescription(choice)
                .addFields(
                    { name: "Reflection", value: "In life, we must live with the consequences of our choices... or our refusal to choose.", inline: false }
                );

            const continueRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('trolley_continue')
                        .setLabel('➡️ Continue Quest')
                        .setStyle(ButtonStyle.Primary)
                );

            try {
                await i.update({ embeds: [embed], components: [continueRow] });
            } catch (error) {
                if (error.code === 10062) {
                    await i.followUp({ embeds: [embed], components: [continueRow] });
                } else {
                    console.error('Error updating interaction:', error);
                    throw error;
                }
            }
        }
    });
}

async function startVengeanceCombat(interaction, userId, parentCollector, activeQuests) {
    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;

    quest.data.combat = {
        playerHealth: 5 + (combatLevel * 2),
        playerMaxHealth: 5 + (combatLevel * 2),
        playerWeapon: await getBestWeapon(userId),
        playerArmor: await getBestArmor(userId),
        combatLevel: combatLevel,
        vengeanceHealth: 7,
        vengeanceMaxHealth: 7,
        round: 0
    };

    const embed = new EmbedBuilder()
        .setTitle("⚔️ VENGEANCE COMBAT")
        .setColor("#FF0000")
        .setDescription("A grief-stricken relative seeks revenge!")
        .addFields(
            { name: "Your Health", value: `${quest.data.combat.playerHealth}/${quest.data.combat.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.combat.playerWeapon.name, inline: true },
            { name: "Your Armor", value: quest.data.combat.playerArmor.name, inline: true },
            { name: "Enemy Health", value: `${quest.data.combat.vengeanceHealth}/${quest.data.combat.vengeanceMaxHealth} HP`, inline: true },
            { name: "Enemy Weapon", value: "Pistol", inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('vengeance_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('vengeance_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    try {
        await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
        if (error.code === 10062) {
            await interaction.followUp({ embeds: [embed], components: [row] });
        } else {
            console.error('Error editing reply:', error);
            throw error;
        }
    }

    // Set up vengeance combat collector
    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleVengeanceCombat(i, userId, collector, parentCollector, activeQuests);
    });
}

async function handleVengeanceCombat(interaction, userId, collector, parentCollector, activeQuests) {
    const { endQuest } = require('../quest.js');
    const quest = activeQuests.get(userId);
    if (!quest || !quest.data.combat) return;

    if (interaction.customId === 'vengeance_run') {
        await endQuest(interaction, userId, false, "You fled from the vengeful attacker! Your quest ends in cowardly retreat.", activeQuests);
        collector.stop();
        parentCollector.stop();
        return;
    }

    quest.data.combat.round++;

    // Player attacks first
    const playerCombatDamage = quest.data.combat.combatLevel + 1;
    const playerWeaponDamage = Math.floor(Math.random() * (quest.data.combat.playerWeapon.maxDamage - quest.data.combat.playerWeapon.minDamage + 1)) + quest.data.combat.playerWeapon.minDamage;
    const playerTotalDamage = playerCombatDamage + playerWeaponDamage;
    const playerFinalDamage = Math.max(1, playerTotalDamage); // No armor for vengeance enemy

    quest.data.combat.vengeanceHealth -= playerFinalDamage;
    quest.data.combat.vengeanceHealth = Math.max(0, quest.data.combat.vengeanceHealth);

    let battleText = `You attack for ${playerFinalDamage} damage!`;

    // Check if vengeance enemy is defeated
    if (quest.data.combat.vengeanceHealth <= 0) {
        // Player wins - give rewards
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

        await interaction.update({ embeds: [embed], components: [continueRow] });
        collector.stop();
        return;
    }

    // Enemy attacks back (pistol damage: 3-5)
    const enemyDamage = Math.floor(Math.random() * 3) + 3; // 3-5 damage
    const enemyFinalDamage = Math.max(1, enemyDamage - quest.data.combat.playerArmor.defense);
    quest.data.combat.playerHealth -= enemyFinalDamage;
    quest.data.combat.playerHealth = Math.max(0, quest.data.combat.playerHealth);

    battleText += `\nThe attacker shoots back for ${enemyFinalDamage} damage!`;

    // Check if player died
    if (quest.data.combat.playerHealth <= 0) {
        // Player dies in quest - this ends the quest in failure
        await endQuest(interaction, userId, false, "You were killed by the vengeful relative! Your quest ends in tragedy.", activeQuests);
        collector.stop();
        parentCollector.stop();
        return;
    }

    // Combat continues
    const embed = new EmbedBuilder()
        .setTitle(`⚔️ VENGEANCE COMBAT - Round ${quest.data.combat.round}`)
        .setColor("#FF0000")
        .setDescription(`${battleText}\n\nThe fight continues!`)
        .addFields(
            { name: "Your Health", value: `${quest.data.combat.playerHealth}/${quest.data.combat.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.combat.playerWeapon.name, inline: true },
            { name: "Your Armor", value: quest.data.combat.playerArmor.name, inline: true },
            { name: "Enemy Health", value: `${quest.data.combat.vengeanceHealth}/${quest.data.combat.vengeanceMaxHealth} HP`, inline: true },
            { name: "Enemy Weapon", value: "Pistol", inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('vengeance_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('vengeance_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row] });
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
    startTrolleyQuest
};