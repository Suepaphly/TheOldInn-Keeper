
# Commands Directory

This directory contains all bot commands organized by functionality. Each subdirectory handles a specific aspect of the game.

## Directory Structure

```
commands/
├── admin/          # Administrative commands (owner only)
├── combat/         # Combat and PvP systems
├── defense/        # Town defense building
├── economy/        # Banking and money management
├── gambling/       # Mini-games and gambling
├── quest/          # Adventure and quest system
├── skills/         # Skill leveling and activities
├── help.js         # Main help system
├── leaderboard.js  # Player rankings
├── quest.js        # Main quest handler
├── send.js         # Item transfer system
└── shop.js         # Item purchasing
```

## Command Categories

### 🔧 Admin Commands (`/admin/`)
**Restriction**: Bot owner only (configured in `config.json`)

- `addmoney.js` - Add kopeks to player accounts
- `cleanup.js` - Database cleanup operations
- `memorystats.js` - Memory usage statistics
- `removeitem.js` - Remove items from player inventories
- `removemoney.js` - Remove kopeks from player accounts
- `removestuff.js` - Remove player data
- `resetcooldown.js` - Reset activity cooldowns
- `resetskills.js` - Reset player skill levels
- `startNewGame.js` - Reset entire game state

### ⚔️ Combat Commands (`/combat/`)
Player vs environment and player vs player combat systems.

- `attack.js` - Attack monsters during battles
- `attackplayer.js` - Challenge other players to PvP
- `backpack.js` - View inventory and equipped items
- `defend.js` - Defensive combat actions
- `revive.js` - Revive dead players (costs kopeks)
- `rob.js` - Rob other players' wallets
- `snoop.js` - Spy on other players
- `startBattle.js` - Force start monster battles
- `steal.js` - Steal items from other players
- `violate.js` - Humiliate other players in combat

### 🏰 Defense Commands (`/defense/`)
Town protection and monster management systems.

- `freeze.js` - Freeze game activities temporarily
- `protect.js` - Interactive defense building system
- `showmap.js` - Display town map and status
- `summon.js` - Summon monsters to attack the town

### 💰 Economy Commands (`/economy/`)
Banking, money management, and basic economic activities.

- `balance.js` - Check kopek balance (alias for wallet)
- `bank.js` - Banking system (deposit/withdraw)
- `beg.js` - Beg for kopeks from NPCs
- `buy.js` - Purchase weapons and armor
- `daily.js` - Daily kopek rewards
- `pay.js` - Transfer kopeks between players
- `sell.js` - Sell items for kopeks
- `stimmy.js` - Government stimulus (admin only)
- `withdraw.js` - Withdraw from bank

### 🎲 Gambling Commands (`/gambling/`)
Casino games and gambling activities.

- `bj.js` - Blackjack card game
- `craps.js` - Craps dice game
- `poker.js` - 5-card draw poker
- `rbet.js` - Place roulette bets
- `rhelp.js` - Roulette help and rules
- `rlast.js` - Last roulette result
- `roulette.js` - Start roulette games
- `slots.js` - Slot machine

### 🗡️ Quest Commands (`/quest/`)
Adventure system with various quest types. See [quest/README.md](quest/README.md) for detailed information.

- `chestQuest.js` - Locked chest puzzles
- `combatSystem.js` - Quest combat mechanics
- `dragonBattle.js` - Dragon boss encounters
- `endquest.js` - End current quest immediately
- `mazeQuest.js` - Maze navigation challenges
- `monsterQuest.js` - Monster hunting quests
- `mysteryQuest.js` - Mystery box interactions
- `riddleQuest.js` - Riddle solving quests
- `trolleyQuest.js` - Moral dilemma choices

### 📈 Skills Commands (`/skills/`)
Skill-based activities and character progression.

- `checklvl.js` - View current skill levels
- `cooldown.js` - Check activity cooldowns
- `craft.js` - Crafting activities
- `fish.js` - Fishing for income
- `gather.js` - Gathering resources
- `hunt.js` - Hunting animals
- `levelup.js` - Spend kopeks to level skills
- `work.js` - Work jobs for income

## Root Command Files

### `help.js`
Interactive help system with categorized command information. Uses Discord buttons to navigate between different help sections.

### `leaderboard.js` 
Displays top players by banked kopeks. Shows usernames and balances in a formatted leaderboard.

### `quest.js`
Main quest system handler. Manages quest selection, location choice, and quest progression. Integrates with all quest types in the `/quest/` directory.

### `send.js`
Item transfer system allowing players to send weapons, armor, and other items to each other. Includes backpack space validation.

### `shop.js`
Weapon and armor purchasing system. Handles item costs, inventory limits, and special restrictions (owner-only items).

## Command Structure Guidelines

### Standard Exports
All command files follow this structure:
```javascript
module.exports.run = async (client, message, args) => {
    // Command logic here
};

module.exports.help = {
    name: "commandname",
    aliases: ["alias1", "alias2"]
};
```

### Database Usage
Commands use QuickDB for data persistence:
```javascript
const { QuickDB } = require("quick.db");
const db = new QuickDB();
```

### Error Handling
Commands should include proper error handling and user feedback for various failure states.

### Restrictions
- Admin commands check for owner ID from `config.json`
- Some commands are disabled during town battles
- Death cooldowns prevent certain activities
- Backpack limits restrict item acquisition

## Integration Points

Commands integrate with several utility systems:
- `utility/protectTheTavern.js` - Monster attack system
- `utility/crystalUtils.js` - Special item handling
- `utility/combatUtils.js` - Combat calculations
- `utility/backpackUtils.js` - Inventory management

See the main [README.md](../README.md) for overall project information and game mechanics.
