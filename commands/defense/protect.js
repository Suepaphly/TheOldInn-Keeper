
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

    // Create main protection interface
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
    aliases: ["defense", "def"]
};
