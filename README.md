
# 🏰 Protect the Tavern - Discord Bot

A cooperative defense Discord bot game where players work together to defend their town from automated monster invasions, complete quests, and build their characters through an extensive RPG system!

## 🎮 Game Overview

**Protect the Tavern** is an interactive Discord bot that creates a persistent multiplayer defense game. Players earn kopeks, build defenses, fight together against waves of monsters that automatically attack the town every few hours, embark on solo quests, and engage in PvP combat.

### Key Features
- **Cooperative Gameplay**: Players must work together to survive monster invasions
- **Advanced Quest System**: Solo adventures with dragons, mazes, riddles, treasure hunts, and moral dilemmas
- **Comprehensive Economy**: Earn kopeks through daily rewards, gathering, fishing, hunting, crafting, and working
- **Defense Building**: Interactive UI for purchasing walls, troops, and traps to protect your town
- **Combat System**: Fight monsters with weapons and armor, plus extensive PvP battles
- **Gambling Mini-Games**: Blackjack, craps, slots, poker, and roulette with full betting systems
- **Automated Events**: Monsters attack automatically on scheduled intervals
- **Banking System**: Keep your kopeks safe from monster raids with deposit/withdrawal
- **Skill Progression**: Level up gathering, fishing, hunting, crafting, and combat skills
- **Character Development**: Equipment system with weapons, armor, and special crystals
- **Memory Management**: Automatic cleanup and optimization systems
- **Admin Tools**: Comprehensive administration commands for game management

## 🚀 Quick Start

### Prerequisites
- Node.js (v20 or higher)
- Discord Bot Token
- Discord Server with appropriate permissions

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Discord bot token as an environment variable:
   ```bash
   DISCORD_TOKEN=your_bot_token_here
   ```
4. Configure the bot settings in `config.json`
5. Run the bot:
   ```bash
   node index.js
   ```

### Required Dependencies
- `discord.js` - Discord API wrapper
- `quick.db` - SQLite database wrapper
- `better-sqlite3` - SQLite3 bindings
- `node-cron` - Task scheduler for automated events
- `parse-ms` - Time parsing utility

## 🎯 How to Play

### Getting Started
1. **Earn Money**: Use `=daily` for 100 kopeks, `=gather` to earn more
2. **Build Defenses**: Use `=protect` for interactive defense building
3. **Check Status**: Use `=showmap` to see town defenses, `=balance` for balance
4. **Join Combat**: Use `=attack` to fight monsters during invasions
5. **Go on Quests**: Use `=quest` to embark on solo adventures for 250+ kopeks

### Core Commands

#### Economy & Banking
- `=balance` / `=wallet` - Check your kopek balance
- `=bank [amount]` - Deposit kopeks safely (no arguments shows balance)
- `=withdraw [amount]` - Withdraw from bank
- `=daily` - Get daily kopek reward (100 kopeks)
- `=pay @user [amount]` - Send kopeks to another player
- `=beg` - Beg for small amounts of kopeks
- `=stimmy` - Government stimulus (admin only)

#### Skills & Gathering
- `=gather` - Earn money gathering resources
- `=fish` - Go fishing for food and income
- `=hunt` - Hunt animals for resources
- `=craft [item]` - Craft items from materials
- `=work` - Work for steady income
- `=checklvl` - View your skill levels
- `=levelup [skill]` - Spend kopeks to increase skill levels
- `=cooldown` - Check activity cooldowns

#### Defense & Town
- `=protect` - Interactive defense building system with buttons
- `=showmap` / `=map` - View town defenses and monster locations
- `=buy [amount] [item]` - Purchase defenses or items
- `=freeze` - Freeze monster attacks (admin)
- `=summon [monster]` - Summon monsters for testing

#### Combat & PvP
- `=attack` - Fight monsters in battle
- `=attackplayer @user` - Challenge another player to PvP
- `=defend` - Defend against attacks
- `=backpack` - View your equipment and items
- `=rob @user` - Attempt to rob another player's wallet
- `=steal @user` - Try to steal items from someone
- `=violate @user` - Humiliate other players in combat
- `=snoop @user` - Spy on other players
- `=revive @user` - Revive dead players (costs kopeks)
- `=startBattle` - Force start monster battles

#### Quest System
- `=quest` - Start a new quest adventure (choose location, complete 2 quests)
- `=endquest @user` - Admin command to end player quests
- Quest types include:
  - **Dragon Battles**: Epic boss fights with crystals and massive rewards
  - **Maze Adventures**: Navigate complex puzzles
  - **Riddle Challenges**: Test your wit and knowledge
  - **Treasure Hunts**: Locked chest puzzles
  - **Mystery Quests**: Solve supernatural mysteries
  - **Trolley Problems**: Make difficult moral choices
  - **Monster Hunts**: Fight quest monsters for rewards

#### Gambling
- `=bj [bet]` - Play blackjack
- `=craps [bet]` - Play craps
- `=slots [bet]` - Play slot machines
- `=poker [bet]` - Play 5-card draw poker
- `=roulette` - Start roulette games
- `=rbet [amount] [bet]` - Place roulette bets
- `=rhelp` - Roulette help and rules
- `=rlast` - Last roulette result

#### Utility & Social
- `=help` - Interactive help system with categorized commands
- `=shop` - Browse and purchase weapons and armor
- `=sell [item] [amount]` - Sell items for kopeks
- `=send @user [item] [amount]` - Send items to other players
- `=leaderboard` - View top players by banked kopeks

### Defense System
- **Walls**: rampart (100k), wall (500k), castle (5000k)
- **Troops**: town_guard, mercenary, soldier, knight, royal_guard
- **Traps**: spikes, boiling_oil, repeater, ballista, cannon
- **Rule**: Every 5 walls = 1 troop slot + 1 trap slot per player
- **Interactive UI**: Button-based building system via `=protect`

### Monster Types & Spawn Schedule
- **Goblin** - Weakest, attacks every 6 hours
- **Mephit** - Moderate threat, attacks every 12 hours
- **Broodling** - Dangerous swarm, attacks every 24 hours
- **Ogre** - Strong individual, attacks every 48 hours
- **Automaton** - Strongest, attacks every 72 hours

### Quest System Details
- **Location-Based**: Choose from 5 different locations (Plains, Forest, Badlands, Wastelands, Highlands)
- **Two-Quest Structure**: Complete 2 quests per adventure for 250+ kopek reward
- **Dragon Encounters**: 50% chance to fight Ancient Dragons after quest completion
- **Crystal System**: Collect colored crystals from dragons for combat bonuses
- **Tiamat Boss**: Ultimate challenge when all 5 crystals are collected
- **30-Minute Timer**: Complete quests within time limit or face failure
- **Quest Restrictions**: Cannot engage in combat/gambling/economy while questing

## 🔧 Bot Configuration

### config.json
```json
{
  "prefix": "=",
  "activity": {
    "game": "The Ol' Innkeeper",
    "streaming": false
  },
  "ownerID": "your_discord_id_here"
}
```

### Required Permissions
- Send Messages
- Read Message History
- Use Slash Commands
- Embed Links
- Attach Files
- Manage Messages (for interactive features)

## 📁 Project Structure

```
├── commands/
│   ├── admin/          # Admin-only commands
│   │   ├── addmoney.js         # Add kopeks to players
│   │   ├── cleanup.js          # Database cleanup
│   │   ├── memorystats.js      # Memory usage statistics
│   │   ├── removeitem.js       # Remove items from players
│   │   ├── removemoney.js      # Remove kopeks from players
│   │   ├── removestuff.js      # Remove player data
│   │   ├── resetcooldown.js    # Reset activity cooldowns
│   │   ├── resetskills.js      # Reset player skill levels
│   │   └── startNewGame.js     # Reset entire game state
│   ├── combat/         # Combat and PvP commands
│   │   ├── attack.js           # Attack monsters
│   │   ├── attackplayer.js     # PvP combat
│   │   ├── backpack.js         # View inventory
│   │   ├── defend.js           # Defensive actions
│   │   ├── revive.js           # Revive dead players
│   │   ├── rob.js              # Rob other players
│   │   ├── snoop.js            # Spy on players
│   │   ├── startBattle.js      # Force monster battles
│   │   ├── steal.js            # Steal items
│   │   └── violate.js          # Humiliate players
│   ├── defense/        # Defense building commands
│   │   ├── freeze.js           # Freeze game activities
│   │   ├── protect.js          # Interactive defense building
│   │   ├── showmap.js          # Display town map
│   │   └── summon.js           # Summon monsters
│   ├── economy/        # Economy and banking commands
│   │   ├── balance.js          # Check kopek balance
│   │   ├── bank.js             # Banking system
│   │   ├── beg.js              # Beg for kopeks
│   │   ├── buy.js              # Purchase items
│   │   ├── daily.js            # Daily rewards
│   │   ├── pay.js              # Transfer kopeks
│   │   ├── sell.js             # Sell items
│   │   ├── stimmy.js           # Government stimulus
│   │   └── withdraw.js         # Bank withdrawals
│   ├── gambling/       # Mini-game commands
│   │   ├── bj.js               # Blackjack
│   │   ├── craps.js            # Craps
│   │   ├── poker.js            # 5-card draw poker
│   │   ├── rbet.js             # Roulette betting
│   │   ├── rhelp.js            # Roulette help
│   │   ├── rlast.js            # Last roulette result
│   │   ├── roulette.js         # Roulette games
│   │   └── slots.js            # Slot machines
│   ├── quest/          # Quest system modules
│   │   ├── chestQuest.js       # Locked chest puzzles
│   │   ├── combatSystem.js     # Quest combat mechanics
│   │   ├── dragonBattle.js     # Dragon boss encounters
│   │   ├── endquest.js         # End quests (admin)
│   │   ├── mazeQuest.js        # Maze navigation
│   │   ├── monsterQuest.js     # Monster hunting
│   │   ├── mysteryQuest.js     # Mystery box interactions
│   │   ├── riddleQuest.js      # Riddle solving
│   │   └── trolleyQuest.js     # Moral dilemmas
│   ├── skills/         # Resource gathering commands
│   │   ├── checklvl.js         # View skill levels
│   │   ├── cooldown.js         # Check cooldowns
│   │   ├── craft.js            # Crafting system
│   │   ├── fish.js             # Fishing activities
│   │   ├── gather.js           # Resource gathering
│   │   ├── hunt.js             # Animal hunting
│   │   ├── levelup.js          # Skill progression
│   │   └── work.js             # Job system
│   ├── help.js         # Interactive help system
│   ├── leaderboard.js  # Player rankings
│   ├── quest.js        # Main quest handler
│   ├── send.js         # Item transfer system
│   └── shop.js         # Weapon/armor purchasing
├── utility/
│   ├── backpackUtils.js        # Inventory management
│   ├── combatUtils.js          # Combat calculations
│   ├── cooldownCleanup.js      # Cooldown cleanup scheduler
│   ├── crystalUtils.js         # Crystal system handling
│   ├── memoryManager.js        # Memory optimization
│   ├── protectTheTavern.js     # Monster attack scheduler
│   ├── protectionButtons.js    # Interactive UI handling
│   ├── questCleanup.js         # Quest cleanup utilities
│   └── utility.js              # Shared utility functions
├── index.js            # Main bot file
├── config.json         # Bot configuration
└── json.sqlite         # Game database
```

## 🎪 Game Mechanics

### Economy
- **Banking**: Deposited kopeks are safe from monster raids
- **Risk vs Reward**: Higher-risk activities offer better rewards
- **Daily Rewards**: Consistent 100 kopek income for all players
- **Skill-based Income**: Leveling skills increases earning potential
- **Item Trading**: Send items between players with backpack limits

### Combat
- **Cooperative**: Players fight together against monsters
- **PvP System**: Challenge other players to duels with full combat mechanics
- **Equipment**: Weapons and armor improve combat effectiveness
- **Crystal Bonuses**: Special crystals provide combat advantages
- **Death Penalties**: 24-hour cooldown when killed
- **Health System**: 5 base health + 2 per combat level

### Defense
- **Shared Responsibility**: All players contribute to town defenses
- **Interactive UI**: Button-based defense building system
- **Scalable**: Defense requirements increase with player count
- **Persistent**: Defenses remain between gaming sessions
- **Strategic**: Different defense types for different strategies

### Quest System
- **Location-Based**: 5 unique locations with different themes
- **Progressive**: Two quests per adventure with increasing difficulty
- **Timed**: 30-minute completion window
- **Rewarding**: 250+ kopeks plus monster value bonuses
- **Challenging**: Dragon encounters and ultimate Tiamat boss
- **Restrictive**: Prevents other activities during quests

### Skills & Progression
- **Multiple Skills**: Gathering, fishing, hunting, crafting, working, combat
- **Cooldown System**: Prevents spam with decreasing cooldowns as skills improve
- **Purchasable Levels**: Spend kopeks to advance skills
- **Practical Benefits**: Higher skills = better income and shorter cooldowns

## 🛠️ Admin Commands

**Owner Only** (configured in config.json):
- `=addmoney @user [amount]` - Add kopeks to a player
- `=removemoney @user [amount]` - Remove kopeks from a player
- `=endquest @user` - Force end a player's quest
- `=removeitem @user [item]` - Remove items from player inventory
- `=resetcooldown @user [skill]` - Reset specific skill cooldowns
- `=resetskills @user` - Reset all player skill levels
- `=startNewGame` - Reset the entire game state
- `=stimmy` - Government stimulus payments
- `=freeze` - Freeze monster attacks
- `=summon [monster]` - Summon specific monsters
- `=memorystats` - View memory usage statistics
- `=cleanup` - Database cleanup operations

## 🔄 Automated Systems

### Monster Attacks
- **Scheduled**: Automatic monster spawns based on type timers
- **Escalating**: Different monsters spawn at different intervals
- **Persistent**: Continues running even when bot restarts
- **Channel-Specific**: Attacks occur in designated channels

### Cleanup Systems
- **Cooldown Cleanup**: Removes expired cooldowns every 15 minutes
- **Memory Management**: Optimizes memory usage every 15 minutes
- **Quest Cleanup**: Manages quest timeouts and cleanup

### Interactive Features
- **Button-Based UI**: Most complex interactions use Discord buttons
- **Collector Systems**: Timed interactions with automatic cleanup
- **State Management**: Persistent game state across restarts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with the bot
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

---

*Join the fight, complete quests, build your skills, and help protect the tavern! 🍺⚔️🐲*

**Bot Status**: Active development with regular updates and new features. The bot maintains persistent state and continues monster attacks automatically.
