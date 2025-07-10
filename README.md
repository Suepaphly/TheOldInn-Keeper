
# 🏰 Protect the Tavern - Discord Bot

A cooperative defense Discord bot game where players work together to defend their town from automated monster invasions!

## 🎮 Game Overview

**Protect the Tavern** is an interactive Discord bot that creates a persistent multiplayer defense game. Players earn money, build defenses, and fight together against waves of monsters that automatically attack the town every few hours.

### Key Features
- **Cooperative Gameplay**: Players must work together to survive monster invasions
- **Economy System**: Earn kopeks through daily rewards, gathering, fishing, hunting, and crafting
- **Defense Building**: Purchase walls, troops, and traps to protect your town
- **Combat System**: Fight monsters with weapons and armor from the shop
- **Gambling Mini-Games**: Blackjack, craps, slots, poker, and roulette
- **Automated Events**: Monsters attack automatically on scheduled intervals
- **Banking System**: Keep your kopeks safe from monster raids

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
3. **Check Status**: Use `=map` to see town defenses, `=wallet` for balance
4. **Join Combat**: Use `=attack` to fight monsters during invasions

### Core Commands
- `=help` - Complete command guide
- `=wallet` - Check your kopek balance
- `=bank [amount]` - Deposit kopeks safely
- `=daily` - Get daily kopek reward
- `=gather` - Earn money gathering resources
- `=buy [amount] [item]` - Purchase defenses
- `=attack` - Fight monsters in battle
- `=shop` - Browse weapons and armor

### Defense System
- **Walls**: rampart (100k), wall (500k), castle (5000k)
- **Troops**: town_guard, mercenary, soldier, knight, royal_guard
- **Traps**: spikes, boiling_oil, repeater, ballista, cannon
- **Rule**: Every 5 walls = 1 troop slot + 1 trap slot per player

### Monster Types
- **Goblin** - Weakest, attacks frequently
- **Mephit** - Moderate threat
- **Broodling** - Dangerous swarm creature
- **Ogre** - Strong individual threat
- **Automaton** - Strongest, rare attacks

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

## 📁 Project Structure

```
├── commands/
│   ├── admin/          # Admin-only commands
│   ├── combat/         # Combat and PvP commands
│   ├── defense/        # Defense building commands
│   ├── economy/        # Economy and banking commands
│   ├── gambling/       # Mini-game commands
│   ├── skills/         # Resource gathering commands
│   ├── help.js         # Help system
│   ├── leaderboard.js  # Player rankings
│   └── shop.js         # Item purchasing
├── utility/
│   ├── protectTheTavern.js  # Monster attack scheduler
│   └── utility.js           # Shared utility functions
├── index.js            # Main bot file
├── config.json         # Bot configuration
└── json.sqlite         # Game database
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🎪 Game Mechanics

### Economy
- **Banking**: Deposited kopeks are safe from monster raids
- **Risk vs Reward**: Higher-risk activities offer better rewards
- **Daily Rewards**: Consistent income source for all players

### Combat
- **Cooperative**: Players fight together against monsters
- **Equipment**: Weapons and armor improve combat effectiveness
- **Strategy**: Different monsters require different approaches

### Defense
- **Shared Responsibility**: All players contribute to town defenses
- **Scalable**: Defense requirements increase with player count
- **Persistent**: Defenses remain between gaming sessions

---

*Join the fight and help protect the tavern! 🍺⚔️*
