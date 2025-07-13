
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
    },
    {
        title: "The Art Gallery Incident",
        description: "Renowned art critic Victoria Sterling was found dead in the modern art wing of the museum during a private exhibition. Her body lay beneath a massive abstract sculpture that had apparently fallen from its mount. Security cameras showed three people entering the gallery after hours: the ambitious young curator who had been publicly humiliated by Sterling's scathing review of the exhibition, the elderly artist whose life's work Sterling had called 'amateur garbage' in a national magazine, and the museum's maintenance worker who had been caught selling fake authentication certificates. A wine glass with Sterling's lipstick was shattered nearby, and a small hammer from the sculpture installation was missing from the tool display.",
        weapons: ["Blunt Object", "Poison", "Crushing"],
        motives: ["Revenge", "Professional Humiliation", "Financial Fraud"],
        suspects: ["Young Curator", "Elderly Artist", "Maintenance Worker"],
        solution: {
            weapon: "Blunt Object",
            motive: "Professional Humiliation",
            suspect: "Elderly Artist"
        },
        explanation: "The elderly artist struck Victoria Sterling with the hammer before staging the scene to look like the sculpture had fallen. The motive was professional humiliation - Sterling's devastating review had destroyed the artist's reputation and career."
    },
    {
        title: "The Kitchen Nightmare",
        description: "Celebrity chef Marco Delacroix was discovered dead in his restaurant's kitchen just before the grand opening of his newest establishment. He was slumped over the prep station with a chef's knife nearby and a pot of boiling stock still bubbling on the stove. The walk-in freezer door was ajar, and several ingredients were scattered across the floor. Three people had keys to the restaurant: his sous chef who had been threatening to expose Marco's stolen recipes and abusive behavior, his business partner who had discovered Marco was embezzling money to pay gambling debts, and the food critic who Marco had physically assaulted after receiving a negative review. A bottle of expensive wine was open on the counter, and the gas burner controls had been tampered with.",
        weapons: ["Stabbing", "Poison", "Gas Inhalation"],
        motives: ["Blackmail", "Financial Betrayal", "Assault Revenge"],
        suspects: ["Sous Chef", "Business Partner", "Food Critic"],
        solution: {
            weapon: "Gas Inhalation",
            motive: "Financial Betrayal",
            suspect: "Business Partner"
        },
        explanation: "The business partner tampered with the gas burner controls, causing Marco to succumb to gas inhalation while cooking. The motive was financial betrayal - the partner had discovered Marco's embezzlement and planned to frame it as an accident to collect insurance money."
    },
    {
        title: "The Theater's Final Act",
        description: "Broadway director Helena Cross was found dead in her private office above the theater during rehearsals for opening night. She was discovered sitting at her desk with a cup of herbal tea and a script covered in red ink corrections. The window was open despite the cold weather, and several threatening letters were scattered on the floor. Three people had access to her office: the lead actor who Helena had been planning to replace due to his drinking problem and missed rehearsals, the theater owner who was furious about Helena's budget overruns and schedule delays, and the playwright whose original vision Helena had completely rewritten without permission. A silk scarf from the costume department was draped over her chair, and the office's antique letter opener was missing from its usual place.",
        weapons: ["Poison", "Strangulation", "Stabbing"],
        motives: ["Career Destruction", "Financial Loss", "Artistic Betrayal"],
        suspects: ["Lead Actor", "Theater Owner", "Playwright"],
        solution: {
            weapon: "Strangulation",
            motive: "Artistic Betrayal",
            suspect: "Playwright"
        },
        explanation: "The playwright strangled Helena with the silk scarf after she refused to restore the original script. The motive was artistic betrayal - Helena had destroyed the playwright's life's work by completely rewriting their play without permission."
    },
    {
        title: "The Tech Startup Tragedy",
        description: "Software mogul David Chen was found dead in his high-tech office on the 30th floor of his company's headquarters. He was slumped over his computer, which displayed lines of code and encrypted files. The office's smart lock system showed only three people had accessed the room that day: his former business partner who had been ousted from the company and was now suing for patent theft, his head of security who had discovered David was selling user data to foreign governments, and his personal assistant who had been secretly recording David's illegal activities to sell to competitors. A energy drink can sat on his desk still cold to the touch, and the office's air purification system had been running on maximum all night. The building's elevator showed someone had accessed the roof earlier that evening.",
        weapons: ["Poison", "Electrocution", "Defenestration"],
        motives: ["Patent Theft", "Espionage Exposure", "Corporate Blackmail"],
        suspects: ["Former Partner", "Security Chief", "Personal Assistant"],
        solution: {
            weapon: "Electrocution",
            motive: "Espionage Exposure",
            suspect: "Security Chief"
        },
        explanation: "The security chief electrocuted David by tampering with his computer setup after discovering the illegal data sales. The motive was espionage exposure - the security chief was actually a government agent investigating David's treasonous activities."
    },
    {
        title: "The Midnight Auction",
        description: "Antiquities dealer Margaret Windsor was found dead in her private auction house vault surrounded by priceless artifacts and ancient treasures. She was discovered clutching a magnifying glass and a certificate of authenticity, with several rare coins scattered around her body. The vault's time-lock had been mysteriously disabled, and the security cameras had been looped to show empty corridors. Three people knew the vault's backup entry code: her apprentice who had recently learned that all the artifacts he'd been selling were stolen goods, her insurance investigator who had discovered Margaret was running an elaborate forgery scheme, and her midnight buyer who had been secretly purchasing stolen art for years until Margaret tried to blackmail him. A small vial labeled 'cleaning solution' was found empty near ancient pottery, and several authentication tools showed signs of recent use.",
        weapons: ["Poison", "Blunt Object", "Strangulation"],
        motives: ["Stolen Goods Discovery", "Insurance Fraud", "Blackmail"],
        suspects: ["Apprentice", "Insurance Investigator", "Midnight Buyer"],
        solution: {
            weapon: "Poison",
            motive: "Blackmail",
            suspect: "Midnight Buyer"
        },
        explanation: "The midnight buyer poisoned Margaret's coffee with chemicals from the artifact cleaning solution after she attempted to blackmail him. The motive was blackmail - Margaret threatened to expose his illegal art collection unless he paid her millions."
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
