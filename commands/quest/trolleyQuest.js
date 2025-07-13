const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { CombatSystem, COMBAT_PRESETS } = require('./combatSystem.js');

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

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

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

            await CombatSystem.updateInteractionSafely(i, { embeds: [embed], components: [] });

            // Set up vengeance combat after a delay
            setTimeout(async () => {
                await startVengeanceCombat(i, userId, collector, activeQuests);
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

            await CombatSystem.updateInteractionSafely(i, { embeds: [embed], components: [continueRow] });
        }
    });
}

async function startVengeanceCombat(interaction, userId, parentCollector, activeQuests) {
    // Stop the parent collector to prevent interference
    parentCollector.stop();
    
    const quest = activeQuests.get(userId);
    const enemyData = COMBAT_PRESETS.vengeanceEnemy();

    // Create combat instance
    const combat = CombatSystem.create(userId, 'vengeance');
    await combat.initializeCombat({}, enemyData);

    // Store combat instance in quest data
    quest.data.combat = combat;

    const { embed, row } = combat.createCombatEmbed("A grief-stricken relative seeks revenge!");

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

    // Set up vengeance combat collector
    const filter = (i) => i.user.id === userId;
    
    // Get the message for the collector
    let message;
    try {
        if (interaction.replied || interaction.deferred) {
            message = await interaction.fetchReply();
        } else {
            message = interaction.message;
        }
    } catch (error) {
        console.error('Error getting message for vengeance combat collector:', error);
        return;
    }
    
    const collector = message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        if (i.customId === 'vengeance_run') {
            const { endQuest } = require('../quest.js');
            await endQuest(i, userId, false, "You fled from combat! Your quest ends in cowardly retreat.", activeQuests);
            collector.stop();
            parentCollector.stop();
            return;
        }

        if (i.customId === 'vengeance_attack') {
            try {
                const combatResult = await quest.data.combat.processCombatRound();

                if (combatResult.result === 'victory') {
                    // Victory - give rewards and continue quest
                    const rewards = await quest.data.combat.handleVictory();

                    const embed = new EmbedBuilder()
                        .setTitle("🏆 VENGEANCE DEFEATED")
                        .setColor("#00FF00")
                        .setDescription(`${combatResult.battleText}\n\nYou have defeated your attacker in self-defense!\n\n**Rewards:**\n💰 +${rewards.money} kopeks\n🔫 +1 pistol`)
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

                    await CombatSystem.updateInteractionSafely(i, { embeds: [embed], components: [continueRow] });
                    collector.stop();
                } else if (combatResult.result === 'defeat') {
                    const { endQuest } = require('../quest.js');
                    await endQuest(i, userId, false, await quest.data.combat.handleDefeat(), activeQuests);
                    collector.stop();
                    parentCollector.stop();
                } else {
                    // Combat continues
                    const { embed, row } = quest.data.combat.createCombatEmbed(combatResult.battleText);
                    await CombatSystem.updateInteractionSafely(i, { embeds: [embed], components: [row] });
                }
            } catch (error) {
                console.error('Error in vengeance combat:', error);
                const { endQuest } = require('../quest.js');
                await endQuest(i, userId, false, "An error occurred during combat. Your quest ends.", activeQuests);
                collector.stop();
                parentCollector.stop();
            }
        }
    });
}

module.exports = {
    startTrolleyQuest
};