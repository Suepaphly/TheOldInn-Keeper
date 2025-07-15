
# Skills Commands

Skill-based activities and character progression system.

## Commands

### Skill Activities
- `gather.js` - Collect resources for kopeks and experience
- `fish.js` - Fish for food and income
- `hunt.js` - Hunt animals for resources
- `craft.js` - Create items from materials
- `work.js` - Steady job income

### Skill Management
- `checklvl.js` - View current skill levels and progress
- `levelup.js` - Spend kopeks to increase skill levels
- `cooldown.js` - Check remaining cooldowns for activities

## Skill System

### Available Skills
- **Gathering**: Collect basic resources
- **Fishing**: Catch fish for food and income
- **Hunting**: Hunt animals for materials
- **Crafting**: Create items from raw materials
- **Working**: Steady employment income
- **Combat**: Fighting effectiveness (leveled through combat)

### Progression Mechanics
- Activities provide experience and skill levels
- Higher levels = better rewards and shorter cooldowns
- Skill levels can be purchased with kopeks using `levelup`
- Each skill has its own cooldown timer

### Cooldown System
- Prevents skill spam
- Cooldowns decrease as skill levels increase
- Different skills have different base cooldowns
- Check remaining time with `cooldown` command

## Integration
Skills integrate with the economy system - higher skill levels lead to better income potential. They also interact with the crafting system for creating equipment and items.
