
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
    },
    {
        title: "The Wedding Day Murder",
        description: "Billionaire bride Sophia Hartwell was found dead in her bridal suite just hours before her wedding ceremony. She was discovered in her wedding dress, slumped over her vanity table with her makeup half-finished. A champagne flute sat nearby, still fizzing with expensive vintage champagne. The door was locked from the inside, but the balcony doors were wide open despite the cold morning air. Three people had master keys to the bridal suite: her maid of honor who had discovered Sophia was having an affair with her fiancé, her wedding planner who had been embezzling money from the event budget for months, and her stepmother who stood to inherit everything if Sophia died before the marriage was finalized. Fresh rose petals were scattered around the room, and a handwritten suicide note was conspicuously placed on the bedside table.",
        weapons: ["Poison", "Defenestration", "Suffocation"],
        motives: ["Betrayal", "Embezzlement", "Inheritance"],
        suspects: ["Maid of Honor", "Wedding Planner", "Stepmother"],
        solution: {
            weapon: "Poison",
            motive: "Inheritance",
            suspect: "Stepmother"
        },
        explanation: "The stepmother poisoned Sophia's champagne with cyanide to secure her inheritance before the wedding could legally transfer Sophia's wealth to her new husband. The suicide note was forged to cover the murder."
    },
    {
        title: "The Gaming Tournament Tragedy",
        description: "Professional esports champion Kyle 'Phoenix' Martinez was found dead at his gaming station during the finals of a million-dollar tournament. He was slumped over his mechanical keyboard, his expensive gaming headset still around his neck. The tournament stream showed him suddenly collapsing mid-game, shocking viewers worldwide. His energy drink can was knocked over, spilling its contents across his RGB setup. Three people had backstage access during the tournament: his longtime rival who had been accused of using performance-enhancing drugs and blamed Kyle for the investigation, his team manager who had discovered Kyle was planning to switch to a competing organization, and his girlfriend who had recently learned Kyle was selling their private photos online for extra income. The gaming chair's electrical components showed signs of tampering, and several pill capsules were scattered under the desk.",
        weapons: ["Electrocution", "Poison", "Strangulation"],
        motives: ["Competitive Rivalry", "Business Betrayal", "Personal Revenge"],
        suspects: ["Gaming Rival", "Team Manager", "Girlfriend"],
        solution: {
            weapon: "Electrocution",
            motive: "Business Betrayal",
            suspect: "Team Manager"
        },
        explanation: "The team manager electrocuted Kyle by tampering with his gaming chair's electrical components after discovering Kyle's plan to defect to a rival organization. The manager couldn't afford to lose his star player and the associated sponsorship deals."
    },
    {
        title: "The Cruise Ship Mystery",
        description: "Luxury cruise director Amanda Reeves was found dead in her private cabin during a stormy night at sea. She was discovered face-down in her bathtub, wearing her evening gown from the captain's dinner. The cabin's porthole was open, letting in the sound of crashing waves and cold ocean air. Water from the bathroom had flooded into the main cabin, ruining several important documents on her desk. Three crew members had access to her cabin: the ship's security chief who had been investigating Amanda for smuggling operations, the head chef who Amanda had been threatening to fire after discovering he was serving expired food to passengers, and the cruise ship's doctor who had been having a secret affair with Amanda while she blackmailed him about his fraudulent medical credentials. A bottle of expensive perfume was shattered on the bathroom floor, and the cabin's safe was found open and empty.",
        weapons: ["Drowning", "Poison", "Blunt Object"],
        motives: ["Criminal Investigation", "Job Security", "Blackmail"],
        suspects: ["Security Chief", "Head Chef", "Ship's Doctor"],
        solution: {
            weapon: "Drowning",
            motive: "Blackmail",
            suspect: "Ship's Doctor"
        },
        explanation: "The ship's doctor drowned Amanda in her bathtub after she threatened to expose his fake medical credentials to the authorities. He staged the scene to look like an accident during the storm, opening the porthole to suggest she fell while trying to close it."
    },
    {
        title: "The Music Festival Fatality",
        description: "Rising pop star Luna Blackthorne was found dead in her backstage trailer during the final night of a massive music festival. She was discovered wearing her stage costume, sitting in front of her makeup mirror with her microphone cord wrapped around her neck. The trailer's air conditioning was running at maximum, making the small space freezing cold despite the summer heat outside. Her backup dancers reported hearing strange sounds from the trailer just before her scheduled performance. Three people had keys to her trailer: her ambitious backup singer who had been secretly recording Luna's new songs to steal and release as her own, her tour manager who had been skimming money from merchandise sales and was about to be exposed by Luna's accountant, and her ex-boyfriend who had been stalking her since their messy breakup and recently violated a restraining order. A syringe was found hidden in the makeup kit, and several threatening fan letters were scattered across the floor.",
        weapons: ["Strangulation", "Injection", "Suffocation"],
        motives: ["Musical Theft", "Embezzlement", "Stalking"],
        suspects: ["Backup Singer", "Tour Manager", "Ex-Boyfriend"],
        solution: {
            weapon: "Injection",
            motive: "Musical Theft",
            suspect: "Backup Singer"
        },
        explanation: "The backup singer injected Luna with a lethal dose of insulin, then staged the scene with the microphone cord to misdirect the investigation. The motive was musical theft - she planned to steal Luna's unreleased songs and launch her own career using the material."
    },
    {
        title: "The Space Observatory Incident",
        description: "Renowned astrophysicist Dr. Elena Cosmos was found dead in the main telescope chamber of the remote mountain observatory. She was discovered floating in the telescope's cooling liquid tank, her lab coat still buttoned and her research notes scattered around the chamber floor. The massive telescope was pointed directly at a newly discovered comet that Dr. Cosmos had been studying obsessively for months. The observatory's climate control system had malfunctioned, causing extreme temperature fluctuations throughout the facility. Three people were at the observatory that night: her research partner who had discovered that Dr. Cosmos was planning to publish their joint research under her name only, the facility's maintenance engineer who had been selling telescope time to unauthorized parties and feared Dr. Cosmos would report him, and her graduate student who had learned that Dr. Cosmos was falsifying data to support her controversial theories about extraterrestrial life. A bottle of liquid nitrogen was missing from the storage room, and the computer systems showed signs of recent data deletion.",
        weapons: ["Freezing", "Drowning", "Poisoning"],
        motives: ["Academic Theft", "Illegal Operations", "Scientific Fraud"],
        suspects: ["Research Partner", "Maintenance Engineer", "Graduate Student"],
        solution: {
            weapon: "Freezing",
            motive: "Scientific Fraud",
            suspect: "Graduate Student"
        },
        explanation: "The graduate student killed Dr. Cosmos by trapping her in the supercooled telescope chamber after discovering her data falsification would destroy both their careers. The student couldn't bear to see years of legitimate research tainted by Dr. Cosmos's fraudulent claims about alien contact."
    },
    {
        title: "The Fashion Week Fatality",
        description: "World-famous fashion designer Valentina Silk was found dead in her atelier just hours before her revolutionary runway show. She was discovered draped over her sewing machine, wearing her signature black dress with golden pins scattered around her workspace. The room's lighting had been dimmed to a romantic amber glow, and several mannequins displayed her final collection. Three people had after-hours access to the atelier: her protégé who had discovered Valentina was planning to steal credit for the protégé's groundbreaking sustainable fabric designs, her business rival who had been secretly photographing Valentina's designs to copy them for his own cheaper line, and her seamstress who had been selling Valentina's fabric scraps and vintage patterns to black market collectors. A bottle of fabric adhesive was found spilled near the sewing station, and the industrial pressing machine was still warm despite being supposedly unused that evening.",
        weapons: ["Suffocation", "Stabbing", "Chemical Poisoning"],
        motives: ["Design Theft", "Industrial Espionage", "Black Market Sales"],
        suspects: ["Protégé", "Business Rival", "Seamstress"],
        solution: {
            weapon: "Suffocation",
            motive: "Design Theft",
            suspect: "Protégé"
        },
        explanation: "The protégé suffocated Valentina with fabric while she worked at her sewing machine, staging the scene to look like an accident. The motive was design theft - the protégé couldn't bear to see their innovative sustainable fabric designs credited to Valentina's name in fashion history."
    },
    {
        title: "The Monastery Murder",
        description: "Brother Benedict, the monastery's head librarian, was found dead in the ancient scriptorium surrounded by illuminated manuscripts and religious texts. He was slumped over a half-finished translation of a medieval prayer book, his monk's robes stained with ink from overturned inkwells. The room's single candle had burned down to a stub, and several rare books were missing from their locked cases. Three members of the religious community had keys to the scriptorium: the young novice who had discovered Brother Benedict was selling authentic medieval manuscripts to private collectors, the visiting scholar who had been denied access to certain forbidden texts that Benedict controlled, and the monastery's treasurer who had learned that Benedict was embezzling donations meant for charitable work. A chalice of communion wine sat on the reading desk, and the heavy wooden cross from the wall had fallen to the floor beside the body.",
        weapons: ["Poison", "Blunt Object", "Strangulation"],
        motives: ["Manuscript Theft", "Academic Denial", "Embezzlement"],
        suspects: ["Young Novice", "Visiting Scholar", "Monastery Treasurer"],
        solution: {
            weapon: "Blunt Object",
            motive: "Academic Denial",
            suspect: "Visiting Scholar"
        },
        explanation: "The visiting scholar struck Brother Benedict with the heavy wooden cross after being repeatedly denied access to forbidden texts that could have advanced his controversial religious theories. The scholar couldn't accept that his life's work was being blocked by Benedict's rigid adherence to monastery rules."
    },
    {
        title: "The Roller Derby Rampage",
        description: "Star jammer 'Lightning Lucy' Rodriguez was found dead in the empty roller rink after a championship bout, still wearing her derby gear and protective helmet. She was discovered at the center of the track with her roller skates' wheels still spinning, surrounded by scattered penalty flags and a knocked-over refreshment stand. The arena's sound system was playing her victory song on repeat at maximum volume. Three people remained in the building after the match: her longtime teammate who had just learned that Lucy was planning to join a rival league and take their sponsorship money with her, the opposing team's captain who had been publicly humiliated by Lucy's aggressive blocking tactics and trash talk, and the rink's maintenance worker who had discovered Lucy was secretly dating his teenage daughter despite being much older. A energy drink bottle was crushed near the penalty box, and the track's electronic scoring system showed signs of recent tampering.",
        weapons: ["Blunt Object", "Electrocution", "Suffocation"],
        motives: ["Team Betrayal", "Public Humiliation", "Protective Parent"],
        suspects: ["Longtime Teammate", "Opposing Captain", "Maintenance Worker"],
        solution: {
            weapon: "Electrocution",
            motive: "Protective Parent",
            suspect: "Maintenance Worker"
        },
        explanation: "The maintenance worker electrocuted Lucy by tampering with the track's electronic systems after discovering her inappropriate relationship with his underage daughter. His parental protective instincts overrode all other considerations when he learned about the illegal relationship."
    },
    {
        title: "The Food Truck Festival Fiasco",
        description: "Celebrity food truck owner Miguel 'El Fuego' Santos was found dead inside his popular taco truck during the annual street food festival. He was discovered face-down in his prep area with his chef's apron still tied, surrounded by chopped vegetables and sizzling meat on the grill. The truck's generator was running at maximum capacity despite the late hour, and the serving window was left wide open with money scattered from the register. Three vendors had access to Miguel's truck during cleanup: his sous chef who had recently discovered Miguel was planning to franchise the truck concept without giving him any credit or compensation, his main competitor who had been losing customers all week to Miguel's innovative fusion recipes, and the festival organizer who had learned Miguel was planning to break his exclusive contract and start his own competing food festival. A bottle of hot sauce with a tampered seal was found on the prep counter, and the truck's propane tanks showed signs of recent adjustment.",
        weapons: ["Poison", "Gas Inhalation", "Stabbing"],
        motives: ["Credit Theft", "Business Competition", "Contract Violation"],
        suspects: ["Sous Chef", "Competitor", "Festival Organizer"],
        solution: {
            weapon: "Gas Inhalation",
            motive: "Contract Violation",
            suspect: "Festival Organizer"
        },
        explanation: "The festival organizer killed Miguel by adjusting the propane tanks to cause gas inhalation after learning about Miguel's plans to start a competing festival. The organizer couldn't afford to lose his star attraction and the associated vendor fees that kept his festival profitable."
    },
    {
        title: "The Escape Room Execution",
        description: "Escape room designer Jake 'The Puzzlemaster' Thompson was found dead inside his latest creation, a horror-themed room called 'The Serial Killer's Lair.' He was discovered chained to a prop electric chair with fake blood splattered around the room, but the blood pooling beneath him was real. The room's elaborate puzzle mechanisms were still running their automated sequences, and several red herrings were scattered around the space. Three people had master codes to override the room's systems: his business partner who had discovered Jake was selling their proprietary puzzle designs to international competitors, his ex-girlfriend who worked as a game master and had learned Jake was secretly recording customers through hidden cameras for blackmail purposes, and his rival escape room owner who had been systematically sabotaged by Jake's fake negative reviews and corporate espionage. A modified electronic lock was found sparking near the victim, and the room's emergency exit had been sealed from the outside.",
        weapons: ["Electrocution", "Stabbing", "Suffocation"],
        motives: ["Design Theft", "Blackmail", "Business Sabotage"],
        suspects: ["Business Partner", "Ex-Girlfriend", "Rival Owner"],
        solution: {
            weapon: "Electrocution",
            motive: "Blackmail",
            suspect: "Ex-Girlfriend"
        },
        explanation: "The ex-girlfriend modified the prop electric chair to deliver a lethal shock after discovering Jake's blackmail scheme using hidden cameras. She couldn't allow him to continue exploiting customers' private moments for money and leverage."
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
