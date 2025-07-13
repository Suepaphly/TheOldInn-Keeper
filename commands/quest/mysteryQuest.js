
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { CombatSystem } = require('./combatSystem.js');

const mysteryScenarios = [
    {
        title: "The Library Murder",
        description: "Professor Blackwood was found dead in the university library at midnight. The security guard discovered him slumped over an ancient tome, a strange smile frozen on his face. The library's rare books section was in disarray, with several volumes scattered on the floor. A half-empty teacup sat on the desk, still warm to the touch. The victim's reading glasses were cracked, and his pen was missing its ink cartridge. Three people had access to the library after hours: his research assistant who was working late on a thesis about medieval poisons, his jealous colleague who was passed over for tenure in favor of Blackwood, and the night janitor who had been caught stealing valuable books to sell online.",
        weapons: ["Poison", "Blunt Object", "Strangulation"],
        motives: ["Jealousy", "Theft", "Academic Rivalry"], 
        suspects: ["Research Assistant", "Colleague", "Night Janitor"],
        solution: {
            weapon: "Poison",
            motive: "Academic Rivalry", 
            suspect: "Research Assistant"
        },
        explanation: "The research assistant poisoned Professor Blackwood's tea using knowledge from their medieval poison research. The motive was academic rivalry - they wanted to steal Blackwood's research and claim it as their own thesis work."
    }
];

async function startMysteryQuest(interaction, userId, activeQuests) {
    const scenario = mysteryScenarios[Math.floor(Math.random() * mysteryScenarios.length)];

    const quest = activeQuests.get(userId);
    quest.data = {
        scenario: scenario,
        selectedWeapon: null,
        selectedMotive: null,
        selectedSuspect: null,
        stage: 'weapon' // weapon -> motive -> suspect -> solution
    };

    const embed = new EmbedBuilder()
        .setTitle("🕵️ DETECTIVE MYSTERY")
        .setColor("#4B0082")
        .setDescription(`**${scenario.title}**\n\n${scenario.description}\n\n**Your task:** Identify the murder weapon, motive, and suspect to solve this case!`)
        .addFields(
            { name: "Step 1", value: "🔪 **Choose the Murder Weapon**", inline: false }
        );

    const weaponMenu = new StringSelectMenuBuilder()
        .setCustomId('mystery_weapon')
        .setPlaceholder('Select the murder weapon...')
        .addOptions(
            scenario.weapons.map(weapon => ({
                label: weapon,
                value: weapon.toLowerCase().replace(/\s+/g, '_'),
                description: `The victim was killed by ${weapon.toLowerCase()}`
            }))
        );

    const row = new ActionRowBuilder().addComponents(weaponMenu);

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        const quest = activeQuests.get(userId);
        
        if (i.customId === 'mystery_weapon') {
            quest.data.selectedWeapon = i.values[0];
            await askForMotive(i, userId, activeQuests, collector);
        } else if (i.customId === 'mystery_motive') {
            quest.data.selectedMotive = i.values[0];
            await askForSuspect(i, userId, activeQuests, collector);
        } else if (i.customId === 'mystery_suspect') {
            quest.data.selectedSuspect = i.values[0];
            await revealSolution(i, userId, activeQuests, collector);
        } else if (i.customId === 'mystery_continue') {
            const { completeQuest } = require('../quest.js');
            await completeQuest(i, userId, activeQuests);
            collector.stop();
        }
    });
}

async function askForMotive(interaction, userId, activeQuests, collector) {
    const quest = activeQuests.get(userId);
    const scenario = quest.data.scenario;

    const embed = new EmbedBuilder()
        .setTitle("🕵️ DETECTIVE MYSTERY")
        .setColor("#4B0082")
        .setDescription(`**${scenario.title}**\n\n${scenario.description}`)
        .addFields(
            { name: "Step 1 ✅", value: "🔪 Murder Weapon Selected", inline: true },
            { name: "Step 2", value: "💭 **Choose the Motive**", inline: true },
            { name: "\u200B", value: "\u200B", inline: true }
        );

    const motiveMenu = new StringSelectMenuBuilder()
        .setCustomId('mystery_motive')
        .setPlaceholder('Select the motive...')
        .addOptions(
            scenario.motives.map(motive => ({
                label: motive,
                value: motive.toLowerCase().replace(/\s+/g, '_'),
                description: `The killer was motivated by ${motive.toLowerCase()}`
            }))
        );

    const row = new ActionRowBuilder().addComponents(motiveMenu);

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
}

async function askForSuspect(interaction, userId, activeQuests, collector) {
    const quest = activeQuests.get(userId);
    const scenario = quest.data.scenario;

    const embed = new EmbedBuilder()
        .setTitle("🕵️ DETECTIVE MYSTERY")
        .setColor("#4B0082")
        .setDescription(`**${scenario.title}**\n\n${scenario.description}`)
        .addFields(
            { name: "Step 1 ✅", value: "🔪 Murder Weapon Selected", inline: true },
            { name: "Step 2 ✅", value: "💭 Motive Selected", inline: true },
            { name: "Step 3", value: "👤 **Choose the Suspect**", inline: true }
        );

    const suspectMenu = new StringSelectMenuBuilder()
        .setCustomId('mystery_suspect')
        .setPlaceholder('Select the suspect...')
        .addOptions(
            scenario.suspects.map(suspect => ({
                label: suspect,
                value: suspect.toLowerCase().replace(/\s+/g, '_'),
                description: `${suspect} is the killer`
            }))
        );

    const row = new ActionRowBuilder().addComponents(suspectMenu);

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
}

async function revealSolution(interaction, userId, activeQuests, collector) {
    const quest = activeQuests.get(userId);
    const scenario = quest.data.scenario;
    
    // Convert selected values back to display format
    const selectedWeapon = scenario.weapons.find(w => w.toLowerCase().replace(/\s+/g, '_') === quest.data.selectedWeapon);
    const selectedMotive = scenario.motives.find(m => m.toLowerCase().replace(/\s+/g, '_') === quest.data.selectedMotive);
    const selectedSuspect = scenario.suspects.find(s => s.toLowerCase().replace(/\s+/g, '_') === quest.data.selectedSuspect);

    // Check if solution is correct
    const weaponCorrect = selectedWeapon === scenario.solution.weapon;
    const motiveCorrect = selectedMotive === scenario.solution.motive;
    const suspectCorrect = selectedSuspect === scenario.solution.suspect;
    
    const totalCorrect = (weaponCorrect ? 1 : 0) + (motiveCorrect ? 1 : 0) + (suspectCorrect ? 1 : 0);
    const isSuccess = totalCorrect >= 2; // Need at least 2/3 correct to succeed

    let resultText = "**THE SOLUTION REVEALED**\n\n";
    resultText += `${scenario.explanation}\n\n`;
    resultText += "**YOUR DEDUCTIONS:**\n";
    resultText += `🔪 Weapon: ${selectedWeapon} ${weaponCorrect ? "✅" : "❌"}\n`;
    resultText += `💭 Motive: ${selectedMotive} ${motiveCorrect ? "✅" : "❌"}\n`;
    resultText += `👤 Suspect: ${selectedSuspect} ${suspectCorrect ? "✅" : "❌"}\n\n`;
    
    if (isSuccess) {
        resultText += `🎉 **CASE SOLVED!** You got ${totalCorrect}/3 correct. Your detective skills have cracked the case!`;
    } else {
        resultText += `❌ **CASE UNSOLVED** You only got ${totalCorrect}/3 correct. The real killer escapes justice...`;
    }

    const embed = new EmbedBuilder()
        .setTitle(`🕵️ ${scenario.title} - SOLVED`)
        .setColor(isSuccess ? "#00FF00" : "#FF0000")
        .setDescription(resultText);

    const continueRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('mystery_continue')
                .setLabel('➡️ Continue Quest')
                .setStyle(ButtonStyle.Primary)
        );

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [continueRow] });

    // If failed completely (0/3), end quest
    if (totalCorrect === 0) {
        const { endQuest } = require('../quest.js');
        await endQuest(interaction, userId, false, "Your detective skills failed completely. The case remains unsolved and your quest ends in failure.", activeQuests);
        collector.stop();
    }
}

module.exports = {
    startMysteryQuest
};
