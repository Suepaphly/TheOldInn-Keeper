
module.exports = {
  // Cooldown timers (in milliseconds)
  COOLDOWNS: {
    CRAFT: 9000000,    // 2.5 hours
    FISH: 7200000,     // 2 hours
    HUNT: 10800000,    // 3 hours
    GATHER: 3600000,   // 1 hour
    WORK: 14400000,    // 4 hours
    DAILY: 86400000,   // 24 hours
    ROB: 3600000,      // 1 hour
    BEG: 1800000,      // 30 minutes
    ATTACK: 300000,    // 5 minutes
  },

  // Economy limits
  ECONOMY: {
    MIN_BET: 10,
    MAX_BET: 1000000,
    MIN_PAY: 1,
    MAX_PAY: 100000,
    MIN_BANK_DEPOSIT: 1,
    BANK_INTEREST_RATE: 0.02,
    DAILY_REWARD_MIN: 100,
    DAILY_REWARD_MAX: 500,
  },

  // Game balance
  GAMBLING: {
    BLACKJACK_HOUSE_EDGE: 0.5,
    SLOTS_MULTIPLIERS: [0, 1.5, 2, 3, 5, 10],
    POKER_PAYOUTS: {
      ROYAL_FLUSH: 50,
      FIVE_OF_A_KIND: 25,
      STRAIGHT_FLUSH: 12,
      FOUR_OF_A_KIND: 7,
      FULL_HOUSE: 5,
      FLUSH: 3,
      STRAIGHT: 2,
      THREE_OF_A_KIND: 1.5,
      TWO_PAIR: 1.5,
    }
  },

  // Combat and monsters
  COMBAT: {
    MONSTER_SPAWN_INTERVALS: {
      GOBLIN: 21600000,    // 6 hours
      MEPHIT: 43200000,    // 12 hours
      BROODLING: 86400000, // 24 hours
      OGRE: 172800000,     // 48 hours
      AUTOMATON: 259200000 // 72 hours
    },
    MAX_MONSTER_ARMY_SIZE: 100,
    BATTLE_TIMEOUT: 300000, // 5 minutes
  },

  // Validation patterns
  VALIDATION: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 32,
    REASON_MAX_LENGTH: 200,
    MAX_ARGS_LENGTH: 10,
  },

  // Error messages
  ERRORS: {
    INSUFFICIENT_FUNDS: "You don't have enough kopeks for this action.",
    INVALID_AMOUNT: "Please enter a valid amount.",
    COOLDOWN_ACTIVE: "You need to wait before using this command again.",
    TOWN_UNDER_ATTACK: "⚔️ The town is under attack! All civilian activities are suspended until the battle ends.",
    COMMAND_ERROR: "An error occurred while processing your command. Please try again.",
    INVALID_USER: "Invalid user specified.",
    AMOUNT_TOO_HIGH: "Amount is too high.",
    AMOUNT_TOO_LOW: "Amount is too low.",
    DATABASE_ERROR: "Database connection failed. Please try again.",
    PARSE_ERROR: "Failed to parse input data.",
    PERMISSION_DENIED: "You don't have permission to use this command.",
    INVALID_CHANNEL: "This command can only be used in specific channels.",
    RATE_LIMITED: "You're doing that too fast. Please slow down.",
  },

  // Success messages
  SUCCESS: {
    MONEY_ADDED: "Successfully added kopeks to your wallet.",
    MONEY_REMOVED: "Successfully removed kopeks from your wallet.",
    ITEM_PURCHASED: "Item purchased successfully.",
    LEVEL_UP: "Congratulations! You leveled up!",
    BATTLE_WON: "Victory! You defeated the monsters!",
    COOLDOWN_RESET: "Cooldown has been reset.",
  },

  // Emoji mappings
  EMOJIS: {
    SUCCESS: "✅",
    ERROR: "❌", 
    WARNING: "⚠️",
    LOADING: "⏳",
    MONEY: "💰",
    BATTLE: "⚔️",
    SHIELD: "🛡️",
    TOOLS: "🔨",
  }
};
