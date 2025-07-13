
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const ptt = require("../../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const user = message.author;
    const money = await db.get(`money_${user.id}`) || 0;

    // If there are arguments, handle the old =buy command functionality
    if (args.length > 0) {
        const amount = args[0];
        const locationOrItem = args[1];
        const item = args[2];

        if (!amount || (!locationOrItem && !item)) {
            message.channel.send(`🏰 **TOWN DEFENSE SHOP** 🏰

**💰 WALLS:**
• \`=protect [amount] rampart\` - 100 kopeks each
• \`=protect [amount] wall\` - 500 kopeks each  
• \`=protect [amount] castle\` - 5,000 kopeks each

**⚔️ TROOPS:** (Requires walls - 1 troop per 5 walls)
• \`=protect [amount] [location] town_guard\` - 50 kopeks
• \`=protect [amount] [location] mercenary\` - 100 kopeks
• \`=protect [amount] [location] soldier\` - 200 kopeks
• \`=protect [amount] [location] knight\` - 500 kopeks
• \`=protect [amount] [location] royal_guard\` - 1,000 kopeks

**🛡️ TRAPS:** (Requires walls - 1 trap per 5 walls)
• \`=protect [amount] [location] spikes\` - 25 kopeks
• \`=protect [amount] [location] boiling_oil\` - 75 kopeks
• \`=protect [amount] [location] repeater\` - 150 kopeks
• \`=protect [amount] [location] ballista\` - 300 kopeks
• \`=protect [amount] [location] cannon\` - 750 kopeks

**Examples:**
\`=protect 10 rampart\` (buy 10 rampart walls)
\`=protect 5 rampart town_guard\` (buy 5 town guards at rampart)
\`=protect 3 castle cannon\` (buy 3 cannons at castle)

*Location options: rampart, wall, castle*

**Or use the interactive menu below:**`);
        } else {
            if (item) {
                // The command includes an item and a location
                if (ptt.troopArray.includes(item) && ptt.wallArray.includes(locationOrItem)) {
                    ptt.buyArmy(item, amount, locationOrItem, user, message);
                    return;
                } else if (ptt.trapArray.includes(item) && ptt.wallArray.includes(locationOrItem)) {
                    ptt.buyTrap(item, amount, locationOrItem, user, message);
                    return;
                } else {
                    message.channel.send(`<@${user.id}>, Make sure you set the location! Ex: =protect 1 castle boiling_oil`);
                    return;
                }
            } else {
                // The command is for buying a wall, rampart, or castle
                const wallItem = locationOrItem;
                if (ptt.wallArray.includes(wallItem)) {
                    ptt.buyWall(wallItem, amount, user, message);
                    return;
                } else {
                    message.channel.send(`<@${user.id}>, Make sure you set the location! Ex: =protect 1 castle boiling_oil`);
                    return;
                }
            }
        }
    }

    // Create main protection interface (if no args or after showing help)
    const embed = new Discord.EmbedBuilder()
        .setTitle("🏰 TOWN PROTECTION CENTER")
        .setColor("#4169E1")
        .setDescription(`Welcome to the Town Protection Center, ${user.username}!\nChoose what you'd like to protect the town with.`)
        .addFields(
            { name: "💰 Your Kopeks", value: `${money.toLocaleString()}`, inline: true },
            { name: "🏰 Current Status", value: await getDefenseStatus(), inline: true }
        )
        .setFooter({ text: "Choose a category to get started!" });

    const row1 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('protect_walls')
                .setLabel('🏗️ Build Walls')
                .setStyle(Discord.ButtonStyle.Primary),
            new Discord.ButtonBuilder()
                .setCustomId('protect_troops')
                .setLabel('⚔️ Deploy Troops')
                .setStyle(Discord.ButtonStyle.Success),
            new Discord.ButtonBuilder()
                .setCustomId('protect_traps')
                .setLabel('🕳️ Set Traps')
                .setStyle(Discord.ButtonStyle.Danger)
        );

    const row2 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('protect_status')
                .setLabel('📊 View Status')
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('protect_help')
                .setLabel('❓ Help')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    await message.channel.send({ embeds: [embed], components: [row1, row2] });
};

async function getDefenseStatus() {
    const ramparts = await db.get("rampart") || 0;
    const walls = await db.get("wall") || 0;
    const castle = await db.get("castle") || 0;
    
    if (castle > 0) return "🏰 Castle Strong";
    if (walls > 0) return "🧱 Walls Standing";
    if (ramparts > 0) return "🪵 Ramparts Up";
    return "💀 Defenseless";
}

module.exports.help = {
    name: "protect",
    aliases: ["defense", "def", "buy"]
};
