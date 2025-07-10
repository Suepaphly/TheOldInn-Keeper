
// ==============================================
// GAME CONSTANTS - PROTECT THE TAVERN
// ==============================================

// ==============================================
// TIMING & COOLDOWNS
// ==============================================

// COOLDOWN TIMES (in milliseconds)
const COOLDOWNS = {
  CRAFT: 9000000, // 2.5 hours
  FISH: 1800000, // 30 minutes
  GATHER: 1800000, // 30 minutes (assumed)
  HUNT: 1800000, // 30 minutes (assumed)
  WORK: 1800000, // 30 minutes (assumed)
  ROB: 3600000, // 1 hour (assumed)
  DAILY: 86400000, // 24 hours
  COOLDOWN_CHECK_THRESHOLD: 9000, // 9 seconds
};

// AUTOMATIC SPAWNING (in minutes)
const AUTO_SPAWN = {
  GOBLIN_INTERVAL: 360, // 6 hours
  MEPHIT_INTERVAL: 720, // 12 hours
  BROODLING_INTERVAL: 1440, // 24 hours
  OGRE_INTERVAL: 2880, // 48 hours
  AUTOMATON_INTERVAL: 4320, // 72 hours
};

// ==============================================
// GAME ENTITIES & STATS
// ==============================================

// TROOP SYSTEM
const TROOPS = {
  TYPES: ["town_guard", "mercenary", "soldier", "knight", "royal_guard"],
  COSTS: [10, 20, 30, 50, 100],
  HEALTH: [1, 5, 10, 25, 50],
  DAMAGE: [1, 2, 5, 7, 9],
};

// TRAP SYSTEM
const TRAPS = {
  TYPES: ["spikes", "boiling_oil", "repeater", "ballista", "cannon"],
  COSTS: [100, 200, 300, 500, 1000],
  DAMAGE: [5, 10, 15, 25, 50],
};

// WALL SYSTEM
const WALLS = {
  TYPES: ["rampart", "wall", "castle"],
  COSTS: [50, 500, 5000],
  HEALTH: [1, 10, 100],
};

// MONSTER SYSTEM
const MONSTERS = {
  TYPES: ["goblin", "mephit", "broodling", "ogre", "automaton"],
  COSTS: [10, 20, 30, 50, 100],
  HEALTH: [1, 5, 10, 25, 50],
  DAMAGE: [2, 8, 14, 21, 28],
  SPAWN_TIMES: [21600000, 43200000, 86400000, 172800000, 259200000], // 6h, 12h, 24h, 48h, 72h
};

// ==============================================
// GAME MECHANICS & RULES
// ==============================================

// DEFENSE RULES
const DEFENSE = {
  WALLS_PER_SLOT: 5, // Every 5 walls = 1 troop slot + 1 trap slot per player
  TROOP_SLOT_MULTIPLIER: 1,
  TRAP_SLOT_MULTIPLIER: 1,
};

// COMBAT SYSTEM
const COMBAT = {
  ATTACK_INTERVAL: 5000, // 5 seconds between attacks
  PLAYER_BASE_HEALTH: 100, // Base player health
  PLAYER_BASE_DAMAGE: 10, // Base player damage
  VIOLATE_ROUNDS: 4, // Number of rounds in violate command
  BATTLE_TURN_LIMIT: 5000, // 5 second intervals for battle turns
};

// BATTLE SYSTEM
const BATTLE = {
  TURN_DURATION: 5000, // 5 seconds per turn
  MAX_BATTLE_TIME: 300000, // 5 minutes max battle time
  ARENA_LOCK_TIMEOUT: 30000, // 30 seconds arena lock
  PLAYER_ATTACK_COOLDOWN: 5000, // 5 seconds between player attacks
};

// ARENA SYSTEM
const ARENA = {
  MAX_PARTICIPANTS: 10, // Maximum players in arena battle
  ENTRY_FEE: 100, // Cost to enter arena
  WINNER_MULTIPLIER: 0.8, // Winner gets 80% of total entry fees
  RESPAWN_TIME: 30000, // 30 seconds to respawn in arena
  BATTLE_PHASES: ["preparation", "combat", "victory", "cleanup"],
  PHASE_DURATIONS: [30000, 300000, 15000, 10000] // Duration for each phase
};

// ==============================================
// PLAYER PROGRESSION & SKILLS
// ==============================================

// XP SYSTEM
const XP_SYSTEM = {
  BASE_XP_REWARD: 10, // Base XP gained per skill action
  LEVEL_UP_XP_MULTIPLIER: 100, // XP required = level * this multiplier
  MAX_SKILL_LEVEL: 100, // Maximum level for skills
  XP_BONUS_MULTIPLIER: 1.5, // Bonus XP multiplier for higher tier rewards
};

// SKILL LEVELING
const SKILLS = {
  BASE_XP_COST: 100, // Base cost to level up skills
  XP_MULTIPLIER: 1.5, // Multiplier for each level
  MAX_LEVEL: 100, // Maximum skill level
  LEVEL_UP_COST_BASE: 1000, // Base kopeks cost to level up
};

// MINIGAME SKILL REWARDS
const SKILL_REWARDS = {
  BASE_AMOUNTS: [25, 50, 100, 200], // Base reward tiers
  MULTIPLIERS: {
    FISH: 2,
    HUNT: 3, 
    GATHER: 1,
    CRAFT: 4,
    WORK: 5
  },
  CHANCE_BY_LEVEL: [
    [42, 26, 21, 10], // Level 0 chances for each tier
    [32, 30, 24, 14], // Level 1
    [24, 32, 27, 17], // Level 2
    [14, 34, 30, 22], // Level 3
    [12, 30, 34, 24], // Level 4
    [10, 24, 38, 28]  // Level 5
  ]
};

// MINIGAME REWARDS (skill-based multipliers)
const REWARDS = {
  TIER_TRASH: 0,
  TIER_COMMON: 1,
  TIER_RARE: 2,
  TIER_LEGENDARY: 3,
  BASE_REWARD: 10,
  SKILL_MULTIPLIER: 1.2,
};

// ==============================================
// MINIGAME CONTENT & ITEMS
// ==============================================

// MINIGAME ITEM ARRAYS
const MINIGAME_ITEMS = {
  FISH: [
    ["minnow", "carp", "bass", "salmon"],
    ["trout", "pike", "catfish", "tuna"],
    ["marlin", "swordfish", "shark", "whale"],
    ["kraken tentacle", "sea dragon scale", "leviathan fin", "poseidon's trident"]
  ],
  HUNT: [
    ["rabbit", "squirrel", "bird", "deer"],
    ["wolf", "bear", "boar", "elk"],
    ["tiger", "lion", "rhino", "elephant"],
    ["dragon", "phoenix", "unicorn", "chimera"]
  ],
  GATHER: [
    ["berries", "mushrooms", "herbs", "flowers"],
    ["crystals", "gems", "rare stones", "minerals"],
    ["ancient coins", "artifacts", "relics", "scrolls"],
    ["philosopher's stone", "eternal flame", "void essence", "star fragment"]
  ],
  CRAFT: [
    ["wooden tool", "simple weapon", "basic armor", "utility item"],
    ["iron equipment", "steel blade", "leather gear", "enchanted item"],
    ["masterwork weapon", "runic armor", "magical trinket", "legendary tool"],
    ["artifact weapon", "divine armor", "godly relic", "cosmic creation"]
  ],
  WORK: [
    ["copper coins", "small wage", "honest pay", "daily earnings"],
    ["silver bonus", "good salary", "promotion pay", "skilled wages"],
    ["gold reward", "expert fee", "master's wage", "prestigious pay"],
    ["royal commission", "noble's reward", "emperor's gift", "divine blessing"]
  ]
};

// SHOP ITEMS AND CATEGORIES
const SHOP = {
  CATEGORIES: {
    WEAPONS: "weapons",
    ARMOR: "armor",
    CONSUMABLES: "consumables"
  },
  ITEM_TYPES: {
    WEAPON: "weapon",
    HELMET: "helmet", 
    CHEST: "chest",
    LEGS: "legs",
    BOOTS: "boots",
    CONSUMABLE: "consumable"
  }
};

// ITEM SYSTEM
const ITEMS = {
  WEAPONS: {
    RUSTY_SWORD: { cost: 100, damage: 5, name: "Rusty Sword" },
    IRON_SWORD: { cost: 500, damage: 15, name: "Iron Sword" },
    STEEL_SWORD: { cost: 1500, damage: 25, name: "Steel Sword" },
    LEGENDARY_BLADE: { cost: 10000, damage: 50, name: "Legendary Blade" }
  },
  ARMOR: {
    LEATHER_ARMOR: { cost: 200, health: 20, name: "Leather Armor" },
    CHAIN_MAIL: { cost: 800, health: 40, name: "Chain Mail" },
    PLATE_ARMOR: { cost: 2000, health: 80, name: "Plate Armor" },
    DRAGON_SCALE: { cost: 15000, health: 150, name: "Dragon Scale Armor" }
  },
  CONSUMABLES: {
    HEALTH_POTION: { cost: 50, healing: 50, name: "Health Potion" },
    MANA_POTION: { cost: 75, mana: 25, name: "Mana Potion" },
    STRENGTH_BOOST: { cost: 100, damage_boost: 10, duration: 3600000, name: "Strength Potion" }
  }
};

// ==============================================
// ECONOMY & FINANCIAL SYSTEMS
// ==============================================

// ECONOMY
const ECONOMY = {
  REVIVE_COST: 1000, // Cost to revive a dead player
  BANK_INTEREST_RATE: 0.05, // 5% (if applicable)
  MINIMUM_BET: 1, // Minimum gambling bet
  DAILY_REWARD_BASE: 100, // Base daily reward (if applicable)
};

// BANK SYSTEM
const BANK = {
  DAILY_INTEREST_RATE: 0.01, // 1% daily interest
  MINIMUM_DEPOSIT: 10, // Minimum amount to deposit
  MAXIMUM_LOAN: 10000, // Maximum loan amount
  LOAN_INTEREST_RATE: 0.15, // 15% loan interest
  WITHDRAWAL_LIMIT: 100000, // Daily withdrawal limit
};

// ROB SYSTEM
const ROB = {
  SUCCESS_RATE: 0.4, // 40% success rate for robbing players
  MINIMUM_TARGET_MONEY: 100, // Target must have at least this much to rob
  STEAL_PERCENTAGE: 0.2, // Steal 20% of target's money
  MAXIMUM_STEAL: 5000, // Maximum amount that can be stolen
  FAILURE_PENALTY: 50, // Amount lost when rob attempt fails
  PROTECTION_DURATION: 3600000, // 1 hour protection after being robbed
};

// ==============================================
// GAMBLING SYSTEMS
// ==============================================

// GAMBLING
const GAMBLING = {
  BLACKJACK_DEALER_STAND: 17, // Dealer stands on 17
  SLOTS_JACKPOT_MULTIPLIER: 10, // Jackpot multiplier
  ROULETTE_MAX_HISTORY: 10, // Maximum roulette history to store
  POKER_DECK_SIZE: 52, // Standard deck size
  CRAPS_PASS_LINE: 7, // Craps pass line number
};

// RANDOM EVENTS AND CHANCES
const RANDOM_EVENTS = {
  BEG_SUCCESS_RATE: 0.5, // 50% success rate for begging
  STIMMY_AMOUNT: 1200, // Stimulus amount
  BANK_ROBBERY_SUCCESS_RATE: 0.3, // 30% success rate
  CRITICAL_HIT_CHANCE: 0.1, // 10% critical hit chance
};

// ==============================================
// USER INTERFACE & MESSAGING
// ==============================================

// MONSTER ATTACK MESSAGES
const MONSTER_MESSAGES = {
  SPAWN_MESSAGES: {
    GOBLIN: "🧌 A goblin has been spotted near the town!",
    MEPHIT: "👹 A mephit emerges from the shadows!",
    BROODLING: "🕷️ A broodling scuttles out of the darkness!",
    OGRE: "👹 An ogre storms toward the town!",
    AUTOMATON: "🤖 An ancient automaton activates!"
  },
  VICTORY_MESSAGES: {
    PLAYER: "🏆 The defenders have successfully repelled the attack!",
    MONSTER: "💀 The monsters have breached the defenses and are raiding the banks!"
  },
  BATTLE_UPDATES: {
    DAMAGE_DEALT: "⚔️ The town's defenses strike for {damage} damage!",
    DAMAGE_TAKEN: "💥 The monster attacks for {damage} damage!",
    MONSTER_DEFEATED: "☠️ The {monster} has been defeated!"
  }
};

// ERROR MESSAGES
const MESSAGES = {
  ERRORS: {
    INSUFFICIENT_FUNDS: "❌ You don't have enough kopeks for this action!",
    ON_COOLDOWN: "⏰ This command is on cooldown. Try again later!",
    INVALID_AMOUNT: "❌ Please enter a valid amount!",
    USER_NOT_FOUND: "❌ User not found or not registered!",
    COMMAND_FAILED: "❌ Command failed to execute. Please try again!",
    PERMISSION_DENIED: "❌ You don't have permission to use this command!",
    PLAYER_DEAD: "💀 You are dead! Use `=revive` to come back to life!",
    ALREADY_IN_BATTLE: "⚔️ You are already in battle!",
    ARENA_LOCKED: "🔒 The arena is currently locked for battle!"
  },
  SUCCESS: {
    MONEY_ADDED: "💰 Kopeks successfully added!",
    MONEY_REMOVED: "💸 Kopeks successfully removed!",
    ITEM_PURCHASED: "🛒 Item successfully purchased!",
    LEVEL_UP: "🆙 Congratulations! You leveled up!",
    BATTLE_WON: "🏆 Victory! You won the battle!",
    COOLDOWN_RESET: "⏰ Cooldown successfully reset!"
  }
};

// EMBED COLORS (Discord)
const COLORS = {
  SUCCESS: "#00FF00",
  ERROR: "#FF0000", 
  WARNING: "#FFFF00",
  INFO: "#0099FF",
  ECONOMY: "#FFD700",
  COMBAT: "#DC143C",
  GAMBLING: "#FF6347",
  DEFENSE: "#4169E1",
  SKILLS: "#32CD32"
};

// ==============================================
// VALIDATION & LIMITS
// ==============================================

// VALIDATION RULES
const VALIDATION = {
  MIN_USERNAME_LENGTH: 2,
  MAX_USERNAME_LENGTH: 32,
  MIN_BET_AMOUNT: 1,
  MAX_BET_AMOUNT: 100000,
  MIN_MONEY_TRANSFER: 1,
  MAX_MONEY_TRANSFER: 1000000,
  COMMAND_RATE_LIMIT: 5000, // 5 seconds between commands
};

// LEADERBOARD SETTINGS
const LEADERBOARD = {
  MAX_ENTRIES: 10,
  CATEGORIES: ["money", "fish_level", "hunt_level", "gather_level", "craft_level", "work_level"]
};

// ==============================================
// TECHNICAL CONFIGURATION
// ==============================================

// ADMIN PERMISSIONS
const ADMIN = {
  OWNER_IDS: ["367445249376649217"], // Owner Discord IDs
  MODERATOR_IDS: [], // Moderator Discord IDs (if applicable)
  ADMIN_MONEY_LIMIT: 1000000, // Maximum money admin can add/remove
};

// DISCORD BOT CONFIGURATION
const BOT = {
  PREFIX: "=",
  ACTIVITY_GAME: "ProtectTheTavern",
  STATUS: "dnd", // dnd, idle, online, invisible
  ACTIVITY_TYPE: "WATCHING", // PLAYING, LISTENING, WATCHING
};

// DISCORD CHANNELS
const CHANNELS = {
  CASTLE: "the_castle", // Main battle channel
  GENERAL: "general", // General chat
  LOGS: "bot-logs", // Bot activity logs
  ANNOUNCEMENTS: "announcements", // Server announcements
};

// DATABASE TABLES AND STRUCTURE
const DATABASE = {
  TABLES: {
    MONEY: "money",
    SKILLS: "skills", 
    COOLDOWNS: "cooldowns",
    TROOPS: "troops",
    TRAPS: "traps",
    WALLS: "walls",
    MONSTERS: "monsters",
    BACKPACK: "backpack",
    LEADERBOARD: "leaderboard",
    ARENA: "arena"
  },
  PLAYER_DEFAULTS: {
    STARTING_MONEY: 0,
    STARTING_HEALTH: 100,
    STARTING_DAMAGE: 10,
    STARTING_SKILL_LEVEL: 0,
    STARTING_XP: 0
  }
};

// DATABASE QUERIES (commonly used patterns)
const DB_QUERIES = {
  MONEY: "money_{userId}",
  SKILLS: {
    FISH_LEVEL: "fish_level_{userId}",
    HUNT_LEVEL: "hunt_level_{userId}",
    GATHER_LEVEL: "gather_level_{userId}",
    CRAFT_LEVEL: "craft_level_{userId}",
    WORK_LEVEL: "work_level_{userId}",
    FISH_XP: "fish_xp_{userId}",
    HUNT_XP: "hunt_xp_{userId}",
    GATHER_XP: "gather_xp_{userId}",
    CRAFT_XP: "craft_xp_{userId}",
    WORK_XP: "work_xp_{userId}"
  },
  COOLDOWNS: {
    FISH: "fish_{userId}",
    HUNT: "hunt_{userId}",
    GATHER: "gather_{userId}",
    CRAFT: "craft_{userId}",
    WORK: "work_{userId}",
    DAILY: "daily_{userId}",
    ROB: "rob_{userId}"
  },
  HEALTH: "health_{userId}",
  DAMAGE: "damage_{userId}",
  DEAD: "dead_{userId}",
  BANK: "bank_{userId}"
};

// FILE PATHS AND DIRECTORIES
const PATHS = {
  CONFIG: "./config.json",
  DATABASE: "./json.sqlite",
  UTILITY: "./utility/",
  COMMANDS: "./commands/",
  LOGS: "./logs/"
};

// ==============================================
// MODULE EXPORTS
// ==============================================

module.exports = {
  // Timing & Cooldowns
  COOLDOWNS,
  AUTO_SPAWN,
  
  // Game Entities & Stats
  TROOPS,
  TRAPS,
  WALLS,
  MONSTERS,
  
  // Game Mechanics & Rules
  DEFENSE,
  COMBAT,
  BATTLE,
  ARENA,
  
  // Player Progression & Skills
  XP_SYSTEM,
  SKILLS,
  SKILL_REWARDS,
  REWARDS,
  
  // Minigame Content & Items
  MINIGAME_ITEMS,
  SHOP,
  ITEMS,
  
  // Economy & Financial Systems
  ECONOMY,
  BANK,
  ROB,
  
  // Gambling Systems
  GAMBLING,
  RANDOM_EVENTS,
  
  // User Interface & Messaging
  MONSTER_MESSAGES,
  MESSAGES,
  COLORS,
  
  // Validation & Limits
  VALIDATION,
  LEADERBOARD,
  
  // Technical Configuration
  ADMIN,
  BOT,
  CHANNELS,
  DATABASE,
  DB_QUERIES,
  PATHS,
};
