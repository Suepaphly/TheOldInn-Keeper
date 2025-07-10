// Game Constants - All magic numbers extracted from the codebase

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

// DEFENSE RULES
const DEFENSE = {
  WALLS_PER_SLOT: 5, // Every 5 walls = 1 troop slot + 1 trap slot per player
  TROOP_SLOT_MULTIPLIER: 1,
  TRAP_SLOT_MULTIPLIER: 1,
};

// ECONOMY
const ECONOMY = {
  REVIVE_COST: 1000, // Cost to revive a dead player
  BANK_INTEREST_RATE: 0.05, // 5% (if applicable)
  MINIMUM_BET: 1, // Minimum gambling bet
  DAILY_REWARD_BASE: 100, // Base daily reward (if applicable)
};

// COMBAT
const COMBAT = {
  ATTACK_INTERVAL: 5000, // 5 seconds between attacks
  PLAYER_BASE_HEALTH: 100, // Base player health
  PLAYER_BASE_DAMAGE: 10, // Base player damage
  VIOLATE_ROUNDS: 4, // Number of rounds in violate command
  BATTLE_TURN_LIMIT: 5000, // 5 second intervals for battle turns
};

// SKILL LEVELING
const SKILLS = {
  BASE_XP_COST: 100, // Base cost to level up skills
  XP_MULTIPLIER: 1.5, // Multiplier for each level
  MAX_LEVEL: 100, // Maximum skill level
  LEVEL_UP_COST_BASE: 1000, // Base kopeks cost to level up
};

// GAMBLING
const GAMBLING = {
  BLACKJACK_DEALER_STAND: 17, // Dealer stands on 17
  SLOTS_JACKPOT_MULTIPLIER: 10, // Jackpot multiplier
  ROULETTE_MAX_HISTORY: 10, // Maximum roulette history to store
  POKER_DECK_SIZE: 52, // Standard deck size
  CRAPS_PASS_LINE: 7, // Craps pass line number
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

// AUTOMATIC SPAWNING (in minutes)
const AUTO_SPAWN = {
  GOBLIN_INTERVAL: 360, // 6 hours
  MEPHIT_INTERVAL: 720, // 12 hours
  BROODLING_INTERVAL: 1440, // 24 hours
  OGRE_INTERVAL: 2880, // 48 hours
  AUTOMATON_INTERVAL: 4320, // 72 hours
};

// ADMIN PERMISSIONS
const ADMIN = {
  OWNER_IDS: ["367445249376649217"], // Owner Discord IDs
  MODERATOR_IDS: [], // Moderator Discord IDs (if applicable)
  ADMIN_MONEY_LIMIT: 1000000, // Maximum money admin can add/remove
};

module.exports = {
  COOLDOWNS,
  TROOPS,
  TRAPS,
  WALLS,
  MONSTERS,
  DEFENSE,
  ECONOMY,
  COMBAT,
  SKILLS,
  GAMBLING,
  REWARDS,
  AUTO_SPAWN,
  ADMIN,
};
