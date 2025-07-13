
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
        title: "The Boxing Gym Beatdown",
        description: "Heavyweight champion 'Iron Mike' Morrison was found dead in his private training gym after hours, slumped against the heavy bag with his boxing gloves still on. The gym's security system had been disabled, and several championship belts were scattered around the ring. A protein shake bottle sat half-empty on the equipment bench, and the gym's ventilation system was running at maximum capacity despite the late hour. Three people had after-hours access to the facility: his ambitious sparring partner who had discovered Mike was using performance-enhancing drugs and threatening to expose him unless he threw his next fight, his corrupt promoter who had been skimming money from Mike's fight purses and betting against him with underground bookmakers, and his estranged brother who had learned Mike was planning to change his will to leave everything to charity instead of family. The gym's electrical equipment showed signs of tampering, and a syringe was found hidden in the equipment locker.",
        weapons: ["Blunt Object", "Injection", "Electrocution"],
        motives: ["Drug Exposure", "Financial Embezzlement", "Inheritance Dispute"],
        suspects: ["Sparring Partner", "Corrupt Promoter", "Estranged Brother"],
        solution: {
            weapon: "Injection",
            motive: "Drug Exposure",
            suspect: "Sparring Partner"
        },
        explanation: "The sparring partner injected Mike with a lethal dose of the same performance-enhancing drugs Mike had been using, turning his own secret against him. The partner couldn't allow Mike to expose the entire underground doping network that would destroy both their careers."
    },
    {
        title: "The Podcast Studio Silencing",
        description: "Popular true crime podcaster Sarah 'Truthseeker' Williams was found dead in her soundproof recording studio with her headphones still on and her microphone positioned perfectly for recording. The studio's recording equipment was still running, capturing hours of silence after her death. Her laptop displayed research notes about a cold case she was investigating, and several threatening emails were open on her secondary monitor. Three people had access to her private studio: her podcast co-host who had discovered Sarah was planning to start a solo show and take their entire audience and sponsor deals with her, the detective whose corruption Sarah was about to expose in her next episode, and the family member of a murder victim whose case Sarah had been sensationalizing for profit without permission. A coffee mug with lipstick stains sat on the mixing board, and the studio's ventilation system had been modified with ductwork leading to the outside.",
        weapons: ["Poison", "Suffocation", "Electrocution"],
        motives: ["Partnership Betrayal", "Corruption Exposure", "Exploitation Anger"],
        suspects: ["Podcast Co-Host", "Corrupt Detective", "Victim's Family Member"],
        solution: {
            weapon: "Suffocation",
            motive: "Corruption Exposure",
            suspect: "Corrupt Detective"
        },
        explanation: "The corrupt detective modified the studio's ventilation system to pump in carbon monoxide, causing Sarah to suffocate while recording. He couldn't allow her to expose his involvement in evidence tampering and wrongful convictions that had sent innocent people to prison."
    },
    {
        title: "The Dance Competition Catastrophe",
        description: "Professional ballroom dancer Elena Graceful was found dead in the competition hall's dressing room, still wearing her elaborate sequined costume and dance shoes. She was discovered sitting at her makeup mirror with her competition number pinned to her dress, surrounded by trophies and flowers from admirers. The dressing room's mirrors had been shattered, and several other dancers' costumes were slashed and ruined. Three people were backstage during the competition: her dance partner who had just discovered Elena was planning to switch partners before the world championships, effectively ending his professional career, her main rival who had been systematically sabotaged by Elena's dirty tactics and bribery of judges, and the competition organizer who had learned Elena was selling performance slots to wealthy amateurs, corrupting the integrity of the sport. A bottle of stage makeup remover was spilled across the vanity, and the room's costume steamer was still running at maximum heat.",
        weapons: ["Stabbing", "Poison", "Burning"],
        motives: ["Career Destruction", "Competition Sabotage", "Sport Corruption"],
        suspects: ["Dance Partner", "Main Rival", "Competition Organizer"],
        solution: {
            weapon: "Stabbing",
            motive: "Competition Sabotage",
            suspect: "Main Rival"
        },
        explanation: "The main rival stabbed Elena with a sharpened dance costume pin after years of Elena's cheating and judge manipulation destroyed the rival's chances at legitimate victory. The rival had finally snapped after discovering Elena's latest bribery scheme."
    },
    {
        title: "The Veterinary Clinic Incident",
        description: "Beloved veterinarian Dr. Amanda Heartwell was found dead in her animal clinic's surgery room, slumped over an operating table with surgical instruments scattered around her. The clinic's animals were unusually agitated, and several cages had been left open with animals roaming freely. A half-finished surgery on a golden retriever remained incomplete, and the clinic's medication storage had been ransacked. Three people had access to the clinic after hours: her veterinary assistant who had discovered Dr. Heartwell was euthanizing healthy animals to sell their organs on the black market, her ex-husband who had learned she was hiding assets in offshore accounts during their bitter divorce proceedings, and the pharmaceutical sales representative who had been supplying her with illegal performance-enhancing drugs for racing dogs. A syringe containing an unknown substance was found in the medical waste, and the clinic's security cameras had been spray-painted over.",
        weapons: ["Injection", "Surgical Instrument", "Animal Attack"],
        motives: ["Animal Cruelty Exposure", "Asset Hiding", "Illegal Drug Trade"],
        suspects: ["Veterinary Assistant", "Ex-Husband", "Pharmaceutical Rep"],
        solution: {
            weapon: "Injection",
            motive: "Animal Cruelty Exposure",
            suspect: "Veterinary Assistant"
        },
        explanation: "The veterinary assistant injected Dr. Heartwell with a lethal dose of animal euthanasia drugs after discovering her horrific black market organ harvesting operation. The assistant couldn't bear to see more innocent animals killed for profit and used the same drugs Dr. Heartwell had been using on healthy pets."
    },
    {
        title: "The Wedding Planner's Final Event",
        description: "Elite wedding planner Priscilla Perfect was found dead in the bridal suite of her most exclusive venue, surrounded by wedding decorations and sample menus for upcoming events. She was discovered wearing one of her signature white suits, slumped over her planning tablet which displayed threatening messages from disgruntled clients. The room's elaborate flower arrangements had been destroyed, and several expensive wedding gifts were missing from their display table. Three people were at the venue for final preparations: her business rival who had discovered Priscilla was stealing client lists and sabotaging competitors' events to maintain her monopoly, her largest client's mother who had learned Priscilla was embezzling money from wedding budgets while providing cheaper alternatives, and her former business partner who had been written out of their company's profits despite contributing the original startup capital. A bottle of champagne was open on the gift table, and the venue's industrial-grade cleaning supplies had been moved from their usual storage location.",
        weapons: ["Poison", "Blunt Object", "Chemical Burning"],
        motives: ["Business Sabotage", "Financial Embezzlement", "Partnership Betrayal"],
        suspects: ["Business Rival", "Client's Mother", "Former Partner"],
        solution: {
            weapon: "Poison",
            motive: "Partnership Betrayal",
            suspect: "Former Partner"
        },
        explanation: "The former business partner poisoned Priscilla's champagne with cleaning chemicals after being systematically cheated out of the wedding planning empire they had built together. Years of legal battles and stolen profits had driven the partner to seek deadly revenge against Priscilla's betrayal."
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
    },
    {
        title: "The Submarine Sabotage",
        description: "Deep-sea researcher Captain Marina Depth was found dead in the command center of her experimental submarine during a classified military mission. She was discovered slumped over the sonar controls with her diving helmet cracked and seawater slowly leaking into the vessel. The submarine's navigation systems had been tampered with, and several classified documents were missing from the secure storage compartment. Three crew members had access to the command center: her first officer who had discovered Marina was planning to sell submarine blueprints to foreign governments for retirement money, her marine biologist colleague who had learned Marina was illegally dumping toxic waste in protected coral reef areas, and her military liaison who had been secretly ordered to eliminate Marina if she discovered the true nature of their 'research' mission. A pressurized oxygen tank was found with its valve deliberately loosened, and the emergency communication system had been disabled from the inside.",
        weapons: ["Drowning", "Pressure Decompression", "Toxic Gas"],
        motives: ["Military Treason", "Environmental Crime", "Classified Mission"],
        suspects: ["First Officer", "Marine Biologist", "Military Liaison"],
        solution: {
            weapon: "Pressure Decompression",
            motive: "Classified Mission",
            suspect: "Military Liaison"
        },
        explanation: "The military liaison sabotaged the submarine's pressure systems after Marina discovered their mission was actually to plant listening devices on enemy naval routes. The liaison had orders to silence anyone who learned the truth about their illegal espionage operation."
    },
    {
        title: "The Ice Sculpture Festival Freeze",
        description: "Master ice sculptor Viktor Frosthand was found frozen solid inside his own ice sculpture during the annual winter arts festival. He was discovered encased in a massive ice block, still holding his carving tools, with his final masterpiece half-completed around him. The festival's refrigeration systems had been running at maximum capacity despite the already freezing temperatures, and several propane torches used for ice shaping were scattered around the work area. Three people were working late at the festival: his apprentice who had discovered Viktor was planning to take full credit for the apprentice's innovative ice preservation techniques, his main competitor who had been losing prestigious commissions to Viktor's superior craftsmanship for years, and the festival director who had learned Viktor was using the event to smuggle diamonds hidden inside ice sculptures. A bottle of liquid nitrogen was found empty near the sculpture, and the workshop's ventilation system had been deliberately blocked.",
        weapons: ["Freezing", "Suffocation", "Chemical Poisoning"],
        motives: ["Technique Theft", "Artistic Rivalry", "Diamond Smuggling"],
        suspects: ["Apprentice", "Main Competitor", "Festival Director"],
        solution: {
            weapon: "Freezing",
            motive: "Diamond Smuggling",
            suspect: "Festival Director"
        },
        explanation: "The festival director trapped Viktor in a rapidly freezing ice mold using liquid nitrogen after discovering the diamond smuggling operation. The director couldn't allow the festival's reputation to be destroyed by Viktor's illegal activities and the associated criminal investigations."
    },
    {
        title: "The Magician's Final Trick",
        description: "World-renowned illusionist 'The Great Mysterio' was found dead on stage inside his signature locked box trick during a sold-out performance. The audience watched in horror as the escape trick went wrong, but investigators found evidence of foul play rather than accident. The theater's stage was covered in his trademark smoke and mirrors, making the crime scene analysis difficult. Three people had backstage access during the performance: his longtime stage assistant who had discovered Mysterio was planning to retire and expose all their trade secrets in a tell-all book, his jealous rival magician who had been copying Mysterio's acts and selling them to cheaper performers, and his business manager who had been embezzling ticket sales and merchandise profits for years. A modified lock mechanism was found inside the escape box, and several of Mysterio's signature props showed signs of sabotage.",
        weapons: ["Suffocation", "Stabbing", "Chemical Gas"],
        motives: ["Secret Exposure", "Trick Theft", "Financial Embezzlement"],
        suspects: ["Stage Assistant", "Rival Magician", "Business Manager"],
        solution: {
            weapon: "Chemical Gas",
            motive: "Secret Exposure",
            suspect: "Stage Assistant"
        },
        explanation: "The stage assistant released toxic gas into Mysterio's escape box after learning about the planned tell-all book that would reveal decades of magic secrets and destroy the assistant's own career prospects. The assistant used their intimate knowledge of the trick to ensure Mysterio couldn't escape in time."
    },
    {
        title: "The Perfume Laboratory Poison",
        description: "Celebrity perfumer Madame Essence was found dead in her private fragrance laboratory surrounded by hundreds of rare scent bottles and aromatic ingredients. She was discovered slumped over her mixing station with a half-completed signature perfume still bubbling in the distillation apparatus. The laboratory's ventilation system had been deliberately disabled, concentrating toxic fumes throughout the sealed workspace. Three people had keys to the exclusive laboratory: her perfume apprentice who had learned Madame Essence was stealing formulas from small independent creators and passing them off as her own work, her main business rival who had been systematically excluded from high-end contracts due to Madame Essence's industry manipulation, and her chemical supplier who had discovered she was diluting expensive ingredients with cheaper alternatives while charging premium prices. A rare poisonous flower extract was missing from the secured ingredient vault, and several formula notebooks had been deliberately damaged with acid.",
        weapons: ["Poison", "Toxic Inhalation", "Chemical Burns"],
        motives: ["Formula Theft", "Business Manipulation", "Ingredient Fraud"],
        suspects: ["Perfume Apprentice", "Business Rival", "Chemical Supplier"],
        solution: {
            weapon: "Toxic Inhalation",
            motive: "Formula Theft",
            suspect: "Perfume Apprentice"
        },
        explanation: "The perfume apprentice disabled the laboratory's ventilation system and released concentrated toxic botanical vapors after discovering Madame Essence's systematic theft of original formulas from struggling artists. The apprentice couldn't stand to see more creative people's work stolen and their careers destroyed by Essence's plagiarism."
    },
    {
        title: "The Antique Clock Tower Mystery",
        description: "Master clockmaker Grandfather Timepiece was found dead at the top of the historic clock tower, tangled in the massive gear mechanisms of the ancient timepiece. He was discovered with his repair tools scattered around the clockwork, and the tower's great bell had been ringing continuously for hours before his body was found. The clock's intricate mechanical systems showed signs of deliberate sabotage, and several valuable antique timepieces from his collection were missing. Three people had access to the clock tower: his horologist apprentice who had discovered Timepiece was selling fake antique clocks as authentic historical pieces, his insurance investigator who had learned the clockmaker was planning to stage a fire to collect massive insurance payouts on his collection, and his estranged son who had been systematically excluded from the family business despite being a more skilled craftsman. A bottle of clock oil was found spilled near the gears, and the tower's safety mechanisms had been deliberately disabled.",
        weapons: ["Crushing", "Strangulation", "Falling"],
        motives: ["Antique Fraud", "Insurance Fraud", "Family Betrayal"],
        suspects: ["Horologist Apprentice", "Insurance Investigator", "Estranged Son"],
        solution: {
            weapon: "Crushing",
            motive: "Family Betrayal",
            suspect: "Estranged Son"
        },
        explanation: "The estranged son sabotaged the clock tower's gear mechanisms to crush Timepiece after years of being denied recognition and inheritance despite superior craftsmanship skills. The son's resentment over family favoritism and professional exclusion finally reached a deadly breaking point when Timepiece announced plans to leave the business to the apprentice instead."
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

    if (isSuccess) {
        const continueRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mystery_continue')
                    .setLabel('➡️ Continue Quest')
                    .setStyle(ButtonStyle.Primary)
            );

        await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [continueRow] });
    } else {
        // Failed to solve the mystery - end quest in failure
        await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [] });
        
        const { endQuest } = require('../quest.js');
        await endQuest(interaction, userId, false, "Your detective skills failed to solve the case. The mystery remains unsolved and your quest ends in failure.", activeQuests);
        collector.stop();
    }
}

module.exports = {
    startMysteryQuest
};
