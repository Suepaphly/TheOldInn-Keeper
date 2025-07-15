
# Admin Commands

**Restriction**: Owner only (configured in `config.json`)

Administrative commands for game management and debugging.

## Commands

### Player Management
- `addmoney.js` - Add kopeks to player accounts
- `removemoney.js` - Remove kopeks from player accounts
- `removestuff.js` - Remove player data entirely
- `resetcooldown.js` - Reset activity cooldowns for players
- `resetskills.js` - Reset all skill levels to 0

### System Management
- `cleanup.js` - Database cleanup operations and quest state fixes
- `memorystats.js` - Display memory usage statistics
- `removeitem.js` - Remove items from player inventories
- `startNewGame.js` - Complete game state reset (nuclear option)

## Usage

All admin commands require the user to be listed as the owner in `config.json`. Commands typically follow the pattern:
```
=commandname @user [additional parameters]
```

Example:
```
=addmoney @player 1000
=resetskills @player
```

## Safety Notes

- `startNewGame` will reset ALL player data
- Use `cleanup` commands carefully as they modify database state
- Always backup important data before major operations
