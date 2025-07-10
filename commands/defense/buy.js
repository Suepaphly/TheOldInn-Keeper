const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    // Check if town is under attack (using the ptt already imported at the top)
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const user = message.author;
    const amount = args[0];
    const locationOrItem = args[1];
    const item = args[2];
    const money = await db.get(`money_${message.author.id}`);

    if (!amount || (!locationOrItem && !item)) {
        message.channel.send(`🏰 **TOWN DEFENSE SHOP** 🏰

**💰 WALLS:**
• \`=buy [amount] rampart\` - 100 kopeks each
• \`=buy [amount] wall\` - 500 kopeks each  
• \`=buy [amount] castle\` - 5,000 kopeks each

**⚔️ TROOPS:** (Requires walls - 1 troop per 5 walls)
• \`=buy [amount] [location] town_guard\` - 50 kopeks
• \`=buy [amount] [location] mercenary\` - 100 kopeks
• \`=buy [amount] [location] soldier\` - 200 kopeks
• \`=buy [amount] [location] knight\` - 500 kopeks
• \`=buy [amount] [location] royal_guard\` - 1,000 kopeks

**🛡️ TRAPS:** (Requires walls - 1 trap per 5 walls)
• \`=buy [amount] [location] spikes\` - 25 kopeks
• \`=buy [amount] [location] boiling_oil\` - 75 kopeks
• \`=buy [amount] [location] repeater\` - 150 kopeks
• \`=buy [amount] [location] ballista\` - 300 kopeks
• \`=buy [amount] [location] cannon\` - 750 kopeks

**Examples:**
\`=buy 10 rampart\` (buy 10 rampart walls)
\`=buy 5 rampart town_guard\` (buy 5 town guards at rampart)
\`=buy 3 castle cannon\` (buy 3 cannons at castle)

*Location options: rampart, wall, castle*`);
    } else {
        if (item) {
            // The command includes an item and a location
            if (ptt.troopArray.includes(item) && ptt.wallArray.includes(locationOrItem)) {
                ptt.buyArmy(item, amount, locationOrItem, user, message);
            } else if (ptt.trapArray.includes(item) && ptt.wallArray.includes(locationOrItem)) {
                ptt.buyTrap(item, amount, locationOrItem, user, message);
            } else {
                message.channel.send(`<@${user.id}>, Make sure you set the location! Ex: =buy 1 castle boiling_oil`);
            }
        } else {
            // The command is for buying a wall, rampart, or castle
            const wallItem = locationOrItem;
            if (ptt.wallArray.includes(wallItem)) {
                ptt.buyWall(wallItem, amount, user, message);
            } else {
                message.channel.send(`<@${user.id}>, Make sure you set the location! Ex: =buy 1 castle boiling_oil`);
            }
        }
    }
}

module.exports.help = {
    name: "buy",
    aliases: ["b"]
}