
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
├── endquest.js           # Manual quest termination command
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
    data: { /* quest-specific data */ }
}
```

## Combat System (`combatSystem.js`)

### SimpleCombat Class

The combat system uses a unified `SimpleCombat` class that handles all quest-based combat encounters.

```javascript
class SimpleCombat {
    constructor(userId, questType) {
        this.userId = userId;
        this.questType = questType; // monster, riddle, maze, vengeance, dragon, tiamat
        this.player = {};
        this.enemy = {};
    }
}
```

### Combat Initialization

```javascript
const combat = CombatSystem.create(userId, 'monster');
await combat.initializeCombat({}, enemyData);
```

**Player Stats Calculation:**
- **Health:** `5 (base) + (combat level × 2) + (red crystal bonus: 4)`
- **Defense:** Best armor defense value
- **Weapon:** Automatically selects best available weapon

**Enemy Data Structure:**
```javascript
{
    name: "Goblin Scout",
    health: 15,
    maxHealth: 15,
    damage: 3,
    defense: 0,
    value: 25 // Kopeks awarded on victory
}
```

### Combat Mechanics

#### Damage Calculation

**Player Attack:**
```javascript
const baseDamage = 1 + combatLevel + redCrystalBonus;
const weaponDamage = rollWeaponDamage();
const totalDamage = baseDamage + weaponDamage;
const finalDamage = Math.max(1, totalDamage - enemyDefense);
```

**Enemy Attack:**
```javascript
const enemyDamage = enemy.damage + Math.floor(Math.random() * 4) - 2; // ±2 variation
const finalDamage = Math.max(1, enemyDamage - playerDefense);
```

#### Weapon System

**Weapon Priority (Best to Worst):**
1. **Rifle** - 6-12 damage
2. **Shotgun** - 4-10 damage  
3. **Dual Pistols** - (3-5) × 2 damage (requires Guns Akimbo feat + 2+ pistols)
4. **Pistol** - 3-5 damage
5. **Sword** - 2-4 damage
6. **Knife** - 1-3 damage
7. **Fists** - 0 damage

**Dual Pistols Logic:**
```javascript
const hasGunsAkimbo = await db.get(`feat_guns_akimbo_${userId}`) || false;
const pistolCount = await db.get(`weapon_pistol_${userId}`) || 0;

if (hasGunsAkimbo && pistolCount >= 2) {
    // Two separate damage rolls
    const firstDamage = Math.floor(Math.random() * 3) + 3; // 3-5
    const secondDamage = Math.floor(Math.random() * 3) + 3; // 3-5
    weaponDamage = firstDamage + secondDamage;
}
```

#### Armor System

**Armor Priority (Best to Worst):**
1. **Dragonscale Armor** - 20 defense
2. **Plate Armor** - 10 defense
3. **Studded Armor** - 5 defense
4. **Chainmail Armor** - 3 defense
5. **Leather Armor** - 2 defense
6. **Cloth Armor** - 1 defense
7. **No Armor** - 0 defense

### Combat Presets

```javascript
const COMBAT_PRESETS = {
    goblinScout: (combatLevel) => ({
        name: "Goblin Scout",
        health: 15 + combatLevel,
        damage: 3 + Math.floor(combatLevel / 2),
        defense: 0,
        value: 25
    }),
    orcRaider: (combatLevel) => ({
        name: "Orc Raider", 
        health: 25 + combatLevel * 2,
        damage: 5 + Math.floor(combatLevel / 2),
        defense: 1,
        value: 40
    }),
    vineBeast: (combatLevel) => ({
        name: "Vine Beast",
        health: 20 + combatLevel,
        damage: 4 + Math.floor(combatLevel / 2),
        defense: 1,
        value: 0
    }),
    vengeanceEnemy: (combatLevel) => ({
        name: "Grief-Stricken Relative",
        health: 18 + combatLevel,
        damage: 6 + Math.floor(combatLevel / 2),
        defense: 0,
        value: 0
    })
};
```

### Combat Flow

1. **Initialize Combat** - Set up player and enemy stats
2. **Create Combat Embed** - Display health, weapons, armor
3. **Player Attack Phase** - Calculate and apply damage
4. **Check Victory** - If enemy health ≤ 0, player wins
5. **Enemy Attack Phase** - Calculate and apply damage  
6. **Check Defeat** - If player health ≤ 0, player loses
7. **Continue** - If both alive, repeat cycle

### Interaction Safety

```javascript
static async updateInteractionSafely(interaction, options) {
    try {
        if (interaction.replied) {
            return await interaction.editReply(options);
        } else if (interaction.deferred) {
            return await interaction.editReply(options);
        } else {
            await interaction.deferUpdate();
            return await interaction.editReply(options);
        }
    } catch (error) {
        // Fallback mechanisms for expired interactions
    }
}
```

## Quest Types

### 1. Monster Quest (`monsterQuest.js`)

**Structure:** Sequential combat against 2 monsters
- Round 1: Goblin Scout
- Round 2: Orc Raider

**Implementation:**
```javascript
async function startMonsterQuest(interaction, userId, activeQuests) {
    const quest = activeQuests.get(userId);
    quest.data = {
        currentRound: 1,
        maxRounds: 2,
        monsters: ["goblinScout", "orcRaider"],
        totalMonsterValue: 0
    };
    
    await startMonsterCombat(interaction, userId, activeQuests, 1);
}
```

### 2. Riddle Quest (`riddleQuest.js`)

**Structure:** Answer 2 riddles with 60-second time limits
- Text-based input via message collectors
- Blue Crystal protection: Wrong answer = combat instead of death

**Key Features:**
- 47 unique riddles with multiple accepted answers
- Sphinx combat encounter for failures
- Message collection for answers

### 3. Maze Quest (`mazeQuest.js`)

**Structure:** Navigate 2 maze sections with 3 choices each
- Outcomes: Forward progress, trap damage, combat encounter
- White Crystal protection from traps and death

**Implementation Pattern:**
```javascript
// 3 path choices per section
const choices = ["left", "middle", "right"];
const outcomes = ["forward", "trap", "combat"];
```

### 4. Trolley Quest (`trolleyQuest.js`)

**Structure:** Moral dilemma with binary choice
- Pull lever or walk away
- 50% chance of vengeance combat after lever pull
- 75+ scenario variations

### 5. Mystery Quest (`mysteryQuest.js`)

**Structure:** Solve murder mystery in 3 parts
- Select weapon, motive, and suspect
- 25+ unique scenarios
- Requires 2/3 correct for success

### 6. Chest Quest (`chestQuest.js`)

**Structure:** Mastermind-style color code puzzle
- 4-color combination from 6 available colors
- 5 attempts with feedback system
- 25% chance of Mimic encounter on success

## Dragon System (`dragonBattle.js`)

### Location-Based Dragons

| Location | Dragon | Crystal | Special Ability |
|----------|--------|---------|-----------------|
| Plains | Ancient White Dragon | White Crystal | Tax (steals 10% coins) |
| Forest | Ancient Black Dragon | Black Crystal | Death (10% instant kill) |
| Badlands | Ancient Red Dragon | Red Crystal | Melt (destroys random item) |
| Wastelands | Ancient Blue Dragon | Blue Crystal | Freeze (skip next turn) |
| Highlands | Ancient Green Dragon | Green Crystal | Heal (2-8 HP recovery) |

### Tiamat Encounter

**Trigger:** Possess all 5 crystals after completing both quest stages

**Abilities:** All 5 dragon special moves plus devastating breath attacks
- **Stats:** 100 HP, 3 defense
- **Reward:** 100,000 kopeks + Dragonscale Armor

## Adding New Quest Types

### Step 1: Create Quest File

Create a new file: `commands/quest/yourQuestName.js`

```javascript
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const CombatSystem = require('./combatSystem.js');

async function startYourQuestName(interaction, userId, activeQuests) {
    const quest = activeQuests.get(userId);
    
    // Initialize quest-specific data
    quest.data = {
        // Your quest state variables
        stage: 1,
        attempts: 0
    };

    // Your quest implementation
    await showQuestInterface(interaction, userId, activeQuests);
}

async function showQuestInterface(interaction, userId, activeQuests) {
    const embed = new EmbedBuilder()
        .setTitle("🎯 Your Quest Title")
        .setColor("#4169E1")
        .setDescription("Quest description goes here");

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('your_quest_action')
                .setLabel('Take Action')
                .setStyle(ButtonStyle.Primary)
        );

    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
    
    // Set up collector
    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleQuestAction(i, userId, activeQuests);
    });
}

module.exports = {
    startYourQuestName
};
```

### Step 2: Register Quest Type

Add to `quest.js` quest type registry:

```javascript
const questTypes = {
    monster: { name: "🐗 Monster Hunt", handler: startMonsterQuest },
    chest: { name: "🗝️ Locked Chest", handler: startChestQuest },
    // ... existing types
    yourquest: { name: "🎯 Your Quest", handler: startYourQuestName }
};
```

Import your handler:
```javascript
const { startYourQuestName } = require('./quest/yourQuestName.js');
```

### Step 3: Quest Implementation Patterns

#### Non-Combat Quest
```javascript
async function handleSuccess(interaction, userId, activeQuests) {
    const { completeQuest } = require('../quest.js');
    await completeQuest(interaction, userId, 0, activeQuests); // 0 = no monster value
}

async function handleFailure(interaction, userId, activeQuests) {
    const { endQuest } = require('../quest.js');
    await endQuest(interaction, userId, false, "Quest failed!", activeQuests);
}
```

#### Quest with Combat
```javascript
async function startCombatEncounter(interaction, userId, activeQuests, enemyType) {
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;
    const enemyData = COMBAT_PRESETS[enemyType](combatLevel);
    
    const combat = CombatSystem.create(userId, 'yourquest');
    await combat.initializeCombat({}, enemyData);
    
    // Store combat reference
    const quest = activeQuests.get(userId);
    quest.data.combat = combat;
    
    const { embed, row } = combat.createCombatEmbed("Combat encounter description");
    await CombatSystem.updateInteractionSafely(interaction, { embeds: [embed], components: [row] });
    
    // Set up combat collector
    setupCombatCollector(interaction, userId, activeQuests);
}

function setupCombatCollector(interaction, userId, activeQuests) {
    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        const quest = activeQuests.get(userId);
        
        if (i.customId === 'yourquest_attack') {
            const combatResult = await quest.data.combat.processCombatRound();
            
            if (combatResult.result === 'victory') {
                // Handle victory - continue quest or complete
                await handleCombatVictory(i, userId, activeQuests);
            } else if (combatResult.result === 'defeat') {
                // Handle defeat - end quest with death
                await handleCombatDefeat(i, userId, activeQuests);
            } else {
                // Continue combat
                const { embed, row } = quest.data.combat.createCombatEmbed(combatResult.battleText);
                await CombatSystem.updateInteractionSafely(i, { embeds: [embed], components: [row] });
            }
        } else if (i.customId === 'yourquest_run') {
            // Handle flee attempt
            await handleFlee(i, userId, activeQuests);
        }
    });
}
```

### Step 4: Crystal Integration

```javascript
// Check for crystal protection
const { hasCrystal } = require('../../utility/crystalUtils.js');
const hasProtectionCrystal = await hasCrystal(userId, 'blue'); // or 'white'

if (hasProtectionCrystal) {
    // Apply protection effect
    await showProtectionMessage(interaction, userId);
} else {
    // Normal consequence
    await handleNormalFailure(interaction, userId, activeQuests);
}
```

### Step 5: Error Handling

Always include comprehensive error handling:

```javascript
collector.on('collect', async (i) => {
    try {
        // Your interaction handling
    } catch (error) {
        console.error('Error in your quest:', error);
        const { endQuest } = require('../quest.js');
        await endQuest(i, userId, false, "An error occurred. Quest ended.", activeQuests);
        collector.stop();
    }
});

collector.on('end', async (collected, reason) => {
    if (reason === 'time') {
        const { endQuest } = require('../quest.js');
        await endQuest(interaction, userId, false, "⏰ Quest timed out!", activeQuests);
    }
});
```

## Best Practices

### 1. Interaction Management
- Always use `CombatSystem.updateInteractionSafely()` for interaction updates
- Handle interaction expiration gracefully
- Set appropriate collector timeouts (1800000ms = 30 minutes)

### 2. State Management
- Store quest state in `quest.data` object
- Clean up state on quest completion/failure
- Use appropriate database keys for persistent data

### 3. User Experience
- Provide clear feedback for all actions
- Use descriptive embed titles and colors
- Include progress indicators for multi-stage quests

### 4. Combat Integration
- Use existing `COMBAT_PRESETS` when possible
- Follow established damage/health formulas
- Handle victory/defeat consistently

### 5. Testing
- Use debug mode: `=quest debug yourquest`
- Test all possible outcomes
- Verify collector cleanup and timeout handling

## Debugging

### Debug Commands
```javascript
=quest debug <questtype>  // Test specific quest
=quest debug dragon       // Dragon selection menu
```

### Common Issues
1. **Interaction Already Acknowledged** - Use `updateInteractionSafely()`
2. **Collector Memory Leaks** - Always stop collectors properly
3. **Database Consistency** - Clean up quest state on all exit paths
4. **Combat State Corruption** - Refresh equipment after item destruction

This comprehensive documentation should help you understand the quest system architecture and provide clear guidance for adding new quest types with or without combat mechanics.
