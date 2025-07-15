
# Combat Commands

Player vs environment and player vs player combat systems.

## Monster Combat
- `attack.js` - Attack monsters during town battles
- `defend.js` - Defensive combat actions
- `startBattle.js` - Force start monster battles (testing)

## Player vs Player (PvP)
- `attackplayer.js` - Challenge other players to duels
- `rob.js` - Steal kopeks from other players' wallets
- `steal.js` - Steal items from other players' inventories
- `violate.js` - Humiliate other players in combat

## Utility
- `backpack.js` - View inventory, equipped items, and stats
- `revive.js` - Revive dead players (costs kopeks)
- `snoop.js` - Spy on other players to see their stats

## Combat Mechanics

### Monster Combat
- Cooperative - all players fight together
- Damage based on combat level + weapon bonuses
- Red crystals provide +2 attack bonus
- Death results in 24-hour cooldown

### PvP Combat
- Challenge system with accept/decline options
- Equipment and skill levels affect damage
- Winners can loot losers' items
- Various combat actions available

## Equipment System
- Weapons increase attack damage
- Armor provides defensive bonuses
- Special items (crystals) provide unique effects
- 10-item backpack limit
