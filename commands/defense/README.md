
# Defense Commands

Town protection and monster management systems.

## Commands

### Town Defense
- `protect.js` - Interactive defense building system with buttons
- `showmap.js` - Display current town defenses and statistics
- `freeze.js` - Temporarily freeze all game activities (admin only)

### Monster Management
- `summon.js` - Manually summon monsters for testing/events

## Defense System

### Defense Types
- **Walls**: rampart (100k), wall (500k), castle (5000k)
- **Troops**: town_guard, mercenary, soldier, knight, royal_guard
- **Traps**: spikes, boiling_oil, repeater, ballista, cannon

### Rules
- Every 5 walls = 1 troop slot per player
- Every 5 walls = 1 trap slot per player
- Defenses are shared among all players
- Stronger defenses cost more kopeks

### Interactive System
The `protect.js` command provides a button-based interface for:
- Viewing current defenses
- Purchasing new defenses
- Strategic defense planning
- Real-time defense status updates

## Monster Attacks
- Automated attacks occur on schedule
- Different monsters have different attack patterns
- Town defenses reduce monster damage
- Players must work together to survive
