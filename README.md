
# 🏰 Protect the Tavern - Discord Bot

A cooperative defense Discord bot game where players work together to defend their town from automated monster invasions, complete quests, and build their characters through an extensive RPG system!

## 🎮 Game Overview

**Protect the Tavern** is an interactive Discord bot that creates a persistent multiplayer defense game. Players earn money, build defenses, fight together against waves of monsters that automatically attack the town every few hours, embark on solo quests, and engage in PvP combat.

### Key Features
- **Cooperative Gameplay**: Players must work together to survive monster invasions
- **Quest System**: Solo adventures with dragons, mazes, riddles, and treasure hunts
- **Economy System**: Earn kopeks through daily rewards, gathering, fishing, hunting, and crafting
- **Defense Building**: Purchase walls, troops, and traps to protect your town
- **Combat System**: Fight monsters with weapons and armor, plus PvP battles
- **Gambling Mini-Games**: Blackjack, craps, slots, poker, and roulette
- **Automated Events**: Monsters attack automatically on scheduled intervals
- **Banking System**: Keep your kopeks safe from monster raids
- **Skill Progression**: Level up gathering, fishing, hunting, and crafting skills
- **Character Development**: Equipment system with weapons, armor, and items

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
2. **Build Defenses**: Buy walls with `=buy 10 rampart`, troops with `=buy 5 rampart town_guard`
3. **Check Status**: Use `=showmap` to see town defenses, `=balance` for balance
4. **Join Combat**: Use `=attack` to fight monsters during invasions
5. **Go on Quests**: Use `=quest` to embark on solo adventures

### Core Commands

#### Economy & Banking
- `=balance` / `=wallet` - Check your kopek balance
- `=bank [amount]` - Deposit kopeks safely
- `=withdraw [amount]` - Withdraw from bank
- `=daily` - Get daily kopek reward (100 kopeks)
- `=pay @user [amount]` - Send kopeks to another player

#### Skills & Gathering
- `=gather` - Earn money gathering resources
- `=fish` - Go fishing for food and income
- `=hunt` - Hunt animals for resources
- `=craft [item]` - Craft items from materials
- `=work` - Work for steady income
- `=checklvl` - View your skill levels

#### Defense & Town
- `=buy [amount] [item]` - Purchase defenses or items
- `=showmap` / `=map` - View town defenses
- `=protect` - Interactive defense building menu
- `=freeze` - Freeze monster attacks (admin)
- `=summon [monster]` - Summon monsters for testing

#### Combat & PvP
- `=attack` - Fight monsters in battle
- `=attackplayer @user` - Challenge another player
- `=defend` - Defend against attacks
- `=backpack` - View your equipment and items
- `=rob @user` - Attempt to rob another player
- `=steal @user` - Try to steal from someone
- `=violate @user` - PvP combat command

#### Quests
- `=quest` - Start a new quest adventure
- Quest types: Dragon battles, mazes, riddles, treasure hunts, mysteries, trolley problems

#### Gambling
- `=bj [bet]` - Play blackjack
- `=craps [bet]` - Play craps
- `=slots [bet]` - Play slot machines
- `=poker [bet]` - Play poker
- `=roulette` / `=rbet [amount] [bet]` - Play roulette

#### Utility
- `=help` - Complete command guide
- `=shop` - Browse weapons and armor
- `=leaderboard` - View top players
- `=send @user [item] [amount]` - Send items to players

### Defense System
- **Walls**: rampart (100k), wall (500k), castle (5000k)
- **Troops**: town_guard, mercenary, soldier, knight, royal_guard
- **Traps**: spikes, boiling_oil, repeater, ballista, cannon
- **Rule**: Every 5 walls = 1 troop slot + 1 trap slot per player

### Monster Types
- **Goblin** - Weakest, attacks frequently (every 6 hours)
- **Mephit** - Moderate threat (every 12 hours)
- **Broodling** - Dangerous swarm creature (every 24 hours)
- **Ogre** - Strong individual threat (every 48 hours)
- **Automaton** - Strongest, rare attacks (every 72 hours)

### Quest System
- **Dragon Battles** - Epic boss fights with massive rewards
- **Maze Adventures** - Navigate complex puzzles
- **Riddle Challenges** - Test your wit and knowledge
- **Treasure Hunts** - Collect valuable chest rewards
- **Mystery Quests** - Solve supernatural puzzles
- **Trolley Problems** - Make difficult moral choices

## 🔧 Bot Configuration

### config.json
```json
{
  "prefix": "=",
  "activity": {
    "streaming": false,
    "game": "ProtectTheTavern"
  }
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
│   │   ├── addmoney.js
│   │   ├── endquest.js
│   │   ├── removeitem.js
│   │   ├── removemoney.js
│   │   ├── removestuff.js
│   │   ├── resetcooldown.js
│   │   ├── resetskills.js
│   │   └── startNewGame.js
│   ├── combat/         # Combat and PvP commands
│   │   ├── attack.js
│   │   ├── attackplayer.js
│   │   ├── backpack.js
│   │   ├── defend.js
│   │   ├── revive.js
│   │   ├── rob.js
│   │   ├── snoop.js
│   │   ├── startBattle.js
│   │   ├── steal.js
│   │   └── violate.js
│   ├── defense/        # Defense building commands
│   │   ├── freeze.js
│   │   ├── protect.js
│   │   ├── showmap.js
│   │   └── summon.js
│   ├── economy/        # Economy and banking commands
│   │   ├── balance.js
│   │   ├── bank.js
│   │   ├── beg.js
│   │   ├── buy.js
│   │   ├── daily.js
│   │   ├── pay.js
│   │   ├── sell.js
│   │   ├── stimmy.js
│   │   └── withdraw.js
│   ├── gambling/       # Mini-game commands
│   │   ├── bj.js (Blackjack)
│   │   ├── craps.js
│   │   ├── poker.js
│   │   ├── rbet.js
│   │   ├── rhelp.js
│   │   ├── rlast.js
│   │   ├── roulette.js
│   │   └── slots.js
│   ├── quest/          # Quest system modules
│   │   ├── chestQuest.js
│   │   ├── combatSystem.js
│   │   ├── dragonBattle.js
│   │   ├── mazeQuest.js
│   │   ├── monsterQuest.js
│   │   ├── mysteryQuest.js
│   │   ├── riddleQuest.js
│   │   └── trolleyQuest.js
│   ├── skills/         # Resource gathering commands
│   │   ├── checklvl.js
│   │   ├── cooldown.js
│   │   ├── craft.js
│   │   ├── fish.js
│   │   ├── gather.js
│   │   ├── hunt.js
│   │   ├── levelup.js
│   │   └── work.js
│   ├── help.js         # Help system
│   ├── leaderboard.js  # Player rankings
│   ├── quest.js        # Main quest handler
│   ├── send.js         # Item transfer system
│   └── shop.js         # Item purchasing
├── utility/
│   ├── backpackUtils.js     # Inventory management
│   ├── combatUtils.js       # Combat calculations
│   ├── cooldownCleanup.js   # Cleanup scheduled tasks
│   ├── crystalUtils.js      # Special item handling
│   ├── protectTheTavern.js  # Monster attack scheduler
│   ├── protectionButtons.js # Interactive UI handling
│   └── utility.js           # Shared utility functions
├── index.js            # Main bot file
├── config.json         # Bot configuration
└── json.sqlite         # Game database
```

## 🎪 Game Mechanics

### Economy
- **Banking**: Deposited kopeks are safe from monster raids
- **Risk vs Reward**: Higher-risk activities offer better rewards
- **Daily Rewards**: Consistent income source for all players
- **Skill-based Income**: Leveling skills increases earning potential

### Combat
- **Cooperative**: Players fight together against monsters
- **PvP System**: Challenge other players to duels
- **Equipment**: Weapons and armor improve combat effectiveness
- **Strategy**: Different monsters require different approaches

### Defense
- **Shared Responsibility**: All players contribute to town defenses
- **Scalable**: Defense requirements increase with player count
- **Persistent**: Defenses remain between gaming sessions
- **Interactive UI**: Button-based defense building system

### Quests
- **Solo Adventures**: Individual quest experiences
- **Varied Challenges**: Multiple quest types with unique mechanics
- **Progression**: Quests provide experience and valuable rewards
- **Cooldown System**: Prevents quest spam while encouraging regular play

## 🛠️ Admin Commands

- `=addmoney @user [amount]` - Add kopeks to a player
- `=removemoney @user [amount]` - Remove kopeks from a player
- `=endquest @user` - Force end a player's quest
- `=removeitem @user [item]` - Remove items from player
- `=resetcooldown @user [skill]` - Reset skill cooldowns
- `=resetskills @user` - Reset player skill levels
- `=startNewGame` - Reset the entire game state

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

---

*Join the fight, embark on quests, and help protect the tavern! 🍺⚔️🐲*
