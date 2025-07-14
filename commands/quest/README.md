
# Quest System Documentation

## Overview

The Quest System is a comprehensive adventure module for the Discord bot that provides immersive, interactive quests with multiple quest types, combat mechanics, dragon encounters, and moral dilemmas. Players embark on two-stage adventures across different locations, facing various challenges and earning rewards.

## Architecture

### Core Components

- **`quest.js`** - Main quest controller and location selection
- **`combatSystem.js`** - Universal combat mechanics and interaction handling
- **Individual Quest Modules** - Specialized quest types with unique mechanics
- **`dragonBattle.js`** - Boss encounters and legendary dragon fights

### File Structure

```
commands/quest/
├── quest.js              # Main quest controller
├── combatSystem.js       # Combat mechanics and interaction utilities
├── chestQuest.js         # Mastermind-style puzzle quest
├── dragonBattle.js       # Dragon boss battles and Tiamat encounter
├── mazeQuest.js          # Hedge maze navigation with traps
├── monsterQuest.js       # Combat encounters with monsters
├── mysteryQuest.js       # Detective murder mystery cases
├── riddleQuest.js        # Ancient riddle challenges
└── trolleyQuest.js       # Moral dilemma scenarios
```

## Quest Flow

### 1. Quest Initiation (`quest.js`)

```javascript
=quest [debug <questtype>]
```

**Location Selection:**
- 🌾 Wide Open Plains → 🏰 Ruined Castle
- 🌲 Dark Forest → 🕳️ Underground Caves  
- 🔥 Crimson Badlands → 🌋 Volcanic Peaks
- ❄️ Frozen Wastelands → 🏔️ Glacial Caverns
- 🌿 Verdant Highlands → 🌳 Primordial Grove

**Quest Structure:**
- **Stage 1:** First location with randomly selected quest type
- **Stage 2:** Second location with another random quest type
- **Completion:** Both stages must be completed for 250 kopek reward
- **Time Limit:** 30 minutes per quest

### 2. Quest State Management

```javascript
const activeQuests = new Map(); // In-memory quest tracking
await db.set(`on_quest_${userId}`, true); // Persistent quest state
```

**Quest Data Structure:**
```javascript
{
    location: "plains",
    startTime: Date.now(),
    questsCompleted: 0,
    totalMonsterValue: 0,
    currentQuest: "monster",
    isDebug: false,
    data: { /* quest-specific data */ }
}
```

## Interaction System

### Discord.js Integration

The quest system uses Discord.js v14 interaction components with sophisticated error handling:

```javascript
// Safe interaction updating with fallback mechanisms
static async updateInteractionSafely(interaction, options) {
    try {
        if (interaction.replied || interaction.deferred) {
            return await interaction.editReply(options);
        } else {
            return await interaction.update(options);
        }
    } catch (error) {
        // Multiple fallback strategies for expired/invalid interactions
    }
}
```

### Collector Management

**Button Collectors:**
```javascript
const collector = interaction.message.createMessageComponentCollector({
    filter: (i) => i.user.id === userId,
    time: 1800000 // 30 minute timeout
});

collector.on('collect', async (i) => {
    // Handle button interactions
});
```

**Message Collectors (for text input):**
```javascript
const collector = interaction.channel.createMessageCollector({
    filter: (message) => message.author.id === userId,
    time: 60000, // 1 minute timeout
    max: 1
});
```

### Error Handling

The system includes comprehensive error handling for common Discord API issues:

- **Interaction Already Acknowledged (40060):** Automatic fallback to `followUp()`
- **Interaction Expired (10062):** Graceful degradation with channel messages
- **Collector Timeouts:** Automatic quest cleanup and user notification

## Quest Types

### 1. Monster Quest (`monsterQuest.js`)

**Mechanics:**
- Sequential combat against 2 monsters (Goblin Scout → Orc Raider)
- Combat level scaling for enemy stats
- Monster value accumulation for bonus rewards

```javascript
const enemyData = COMBAT_PRESETS.goblinScout(combatLevel);
const combat = CombatSystem.create(userId, 'monster');
await combat.initializeCombat({}, enemyData);
```

### 2. Riddle Quest (`riddleQuest.js`)

**Mechanics:**
- 2 random riddles from a pool of 47 unique riddles
- 60-second time limit per riddle
- Blue Crystal protection: Wrong answer triggers Sphinx combat instead of death
- Text-based answer collection via message collectors

```javascript
const riddle = riddles[Math.floor(Math.random() * riddles.length)];
const correctAnswers = [riddle.answer, ...riddle.alternatives];
```

### 3. Maze Quest (`mazeQuest.js`)

**Mechanics:**
- 2-stage path selection (3 choices each)
- Randomized outcomes: Forward, Trap, Combat
- White Crystal protection from traps and death
- Vine Beast combat encounters

### 4. Trolley Quest (`trolleyQuest.js`)

**Mechanics:**
- Randomized moral dilemma scenarios (75+ variations)
- Binary choice: Pull lever or walk away
- 50% chance of vengeance combat after lever pull
- Philosophical reflection component

```javascript
const scenario = trolleyScenarios[Math.floor(Math.random() * trolleyScenarios.length)];
// scenario: { many: "5 grandmothers", one: "1 judge" }
```

### 5. Mystery Quest (`mysteryQuest.js`)

**Mechanics:**
- 25+ unique murder mystery scenarios
- 3-part deduction: Weapon, Motive, Suspect
- Select menu interactions for choices
- Requires 2/3 correct for success

```javascript
const scenario = mysteryScenarios[Math.floor(Math.random() * mysteryScenarios.length)];
// Complex murder mystery with multiple suspects, weapons, and motives
```

### 6. Chest Quest (`chestQuest.js`)

**Mechanics:**
- Mastermind-style color code puzzle
- 4-color combination from 6 available colors
- 5 attempts with feedback (✅ correct position, 🟨 correct color wrong position)
- 25% chance of Mimic encounter upon success

```javascript
const secretCode = [];
for (let i = 0; i < 4; i++) {
    secretCode.push(colors[Math.floor(Math.random() * colors.length)].id);
}
```

## Combat System (`combatSystem.js`)

### Core Combat Class

```javascript
class CombatSystem {
    constructor(userId, combatType = 'default') {
        this.userId = userId;
        this.combatType = combatType; // monster, riddle, maze, vengeance, dragon, tiamat
        this.combatData = null;
    }
}
```

### Combat Initialization

```javascript
await combat.initializeCombat({
    health: playerHealth,
    weapon: bestWeapon,
    armor: bestArmor
}, {
    name: "Goblin Scout",
    health: 8 + (combatLevel * 2),
    damage: 3 + Math.floor(combatLevel * 0.6),
    defense: Math.floor(combatLevel * 0.4),
    value: 25
});
```

### Combat Round Processing

```javascript
async processCombatRound() {
    // Player attacks first
    const playerDamage = this.calculatePlayerDamage();
    this.combatData.enemyHealth -= playerDamage;
    
    if (this.combatData.enemyHealth <= 0) {
        return { result: 'victory', battleText, combatData };
    }
    
    // Enemy counterattack
    const enemyDamage = this.calculateEnemyDamage();
    this.combatData.playerHealth -= enemyDamage;
    
    if (this.combatData.playerHealth <= 0) {
        return { result: 'defeat', battleText, combatData };
    }
    
    return { result: 'continue', battleText, combatData };
}
```

### Weapon System

**Dual Pistols (Guns Akimbo Feat):**
```javascript
if (this.combatData.playerWeapon.isDual) {
    // Two separate attack rolls
    const firstDamage = calculateAttack();
    const secondDamage = calculateAttack();
    playerFinalDamage = firstDamage + secondDamage;
}
```

**Weapon Priority:**
1. Rifle (6-12 damage)
2. Shotgun (4-10 damage)  
3. Dual Pistols (3-5 damage × 2)
4. Pistol (3-5 damage)
5. Sword (2-4 damage)
6. Knife (1-3 damage)
7. Fists (0 damage)

## Dragon System (`dragonBattle.js`)

### Location-Based Dragons

Each quest location has an associated Ancient Dragon:

| Location | Dragon | Crystal | Special Ability |
|----------|--------|---------|-----------------|
| Plains | Ancient White Dragon | White Crystal | Tax (steals 10% coins) |
| Forest | Ancient Black Dragon | Black Crystal | Death (10% instant kill) |
| Redlands | Ancient Red Dragon | Red Crystal | Melt (destroys random item) |
| Frostlands | Ancient Blue Dragon | Blue Crystal | Freeze (skip next turn) |
| Emeraldlands | Ancient Green Dragon | Green Crystal | Heal (2-8 HP recovery) |

### Dragon Spawn Conditions

```javascript
// 50% chance after first quest of the day
const shouldSpawnDragon = dailyQuests >= 1 && Math.random() < 0.5;
```

### Tiamat Encounter

**Trigger Conditions:**
- Possess all 5 crystals (white, black, red, blue, green)
- Complete both quest stages
- Not on 24-hour cooldown

**Tiamat Abilities:**
- All 5 dragon special moves
- Devastating breath attacks (8-15 damage)
- 100 HP with 3 defense
- Ultimate reward: 100,000 kopeks + Dragonscale Armor

```javascript
class TiamatCombatSystem extends CombatSystem {
    async executeSpecialMove(ability) {
        // Randomly uses tax, death, melt, freeze, or heal
        // Plus powerful breath weapon attacks
    }
}
```

## Crystal Protection System

### Crystal Effects

| Crystal | Protection |
|---------|------------|
| **White** | Prevents trap damage and maze death |
| **Blue** | Riddle failure triggers combat instead of death |
| Others | Future implementations planned |

### Usage Check

```javascript
const { hasCrystal } = require('../../utility/crystalUtils.js');
const hasWhiteCrystal = await hasCrystal(userId, 'white');

if (hasWhiteCrystal) {
    // Apply protection
} else {
    // Normal consequence
}
```

## Debug System

### Owner Debug Commands

```javascript
=quest debug <questtype>  // Test specific quest types
=quest debug dragon       // Dragon selection menu
```

**Features:**
- Immediate quest type testing
- No real rewards given
- 30-minute timeout still applies
- Complete after 1 quest instead of 2

### Debug Quest Types

- `monster` - Combat quest with 2 monsters
- `riddle` - Ancient riddle solving quest  
- `maze` - Hedge maze navigation quest
- `trolley` - Moral dilemma trolley problem
- `mystery` - Detective murder mystery case
- `chest` - Mastermind color code puzzle
- `dragon` - Choose any boss dragon to fight

## State Management

### Quest Restrictions

Players on quests cannot:
- Engage in combat commands
- Use gambling commands  
- Perform economic activities
- Start new quests

```javascript
async function isOnQuest(userId) {
    return activeQuests.has(userId) || await db.get(`on_quest_${userId}`);
}
```

### Cleanup Systems

**Automatic Cleanup:**
- 30-minute quest timeout
- Death cooldown removal (24 hours)
- Daily quest counter reset
- Collector garbage collection

**Manual Cleanup:**
```javascript
async function endQuest(interaction, userId, success, message, activeQuests) {
    activeQuests.delete(userId);
    await db.delete(`on_quest_${userId}`);
    // Send completion message
}
```

## Rewards System

### Base Rewards

- **Quest Completion:** 250 kopeks
- **Monster Bonus:** 50% of total monster value
- **Dragon Victory:** Location-specific crystal
- **Tiamat Victory:** 100,000 kopeks + Dragonscale Armor

### Monster Values

```javascript
const COMBAT_PRESETS = {
    goblinScout: { value: 25 },
    orcRaider: { value: 40 },
    vineBeast: { value: 0 },
    vengeanceEnemy: { value: 0 }
};
```

## Error Recovery

### Common Issues and Solutions

1. **Interaction Already Acknowledged**
   - Automatic fallback to `editReply()` or `followUp()`
   - Graceful degradation to channel messages

2. **Collector Timeouts**
   - Automatic quest cleanup
   - User notification of timeout
   - State restoration

3. **Database Consistency**
   - Dual state tracking (memory + database)
   - Cleanup on bot restart
   - Timeout-based recovery

## Development Guidelines

### Adding New Quest Types

1. Create new file in `/quest/` folder
2. Export `start[QuestName]Quest` function
3. Add to quest type registry in `quest.js`
4. Implement collector pattern with error handling
5. Use `CombatSystem.updateInteractionSafely()` for all updates

### Interaction Best Practices

```javascript
// Always use the safe update method
await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });

// Set up collectors with proper timeout and filtering
const filter = (i) => i.user.id === userId;
const collector = message.createMessageComponentCollector({ filter, time: 1800000 });

// Handle collector cleanup
collector.on('end', async (collected, reason) => {
    if (reason === 'time') {
        // Handle timeout
    }
});
```

### Combat Integration

```javascript
// Create combat instance
const combat = CombatSystem.create(userId, 'questtype');
await combat.initializeCombat(playerData, enemyData);

// Process combat rounds
const combatResult = await combat.processCombatRound();

if (combatResult.result === 'victory') {
    // Handle victory
} else if (combatResult.result === 'defeat') {
    // Handle defeat  
} else {
    // Continue combat
}
```

## Performance Considerations

### Memory Management

- Active quests stored in Map for fast access
- Automatic cleanup after 30 minutes
- Database persistence for bot restarts

### Rate Limiting

- One quest per user at a time
- 30-minute timeout prevents hanging states
- Daily quest tracking for dragon spawning

### Scalability

- Modular quest system allows easy expansion
- Centralized combat system reduces code duplication
- Collector-based interactions handle concurrent users

---

This documentation covers the complete quest system architecture, from basic quest flow to advanced dragon encounters. The system is designed to be extensible, fault-tolerant, and engaging for Discord bot users.
