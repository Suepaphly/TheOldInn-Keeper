
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require('discord.js');
const ptt = require("../../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    const user = message.author;
    const userId = user.id;

    // Check if town is under attack
    if (!ptt.lockArena) {
        return message.channel.send("❌ The town is not under attack! You can only use freeze during combat.");
    }

    // Check if user has blue crystal
    const { hasCrystal } = require("../../utility/crystalUtils.js");
    const hasBlueCrystal = await hasCrystal(userId, 'blue');
    
    if (!hasBlueCrystal) {
        return message.channel.send("❌ You need a Blue Crystal to use the freeze ability! 🔵");
    }

    // Check if freeze has already been used this combat
    const freezeUsed = await db.get("freeze_used_this_combat") || false;
    if (freezeUsed) {
        return message.channel.send("❌ Freeze has already been used this combat! Only one freeze per battle.");
    }

    // Check if user has already used freeze this combat
    const userFreezeUsed = await db.get(`user_freeze_used_${userId}_${ptt.currentBattleTurn}`) || false;
    if (userFreezeUsed) {
        return message.channel.send("❌ You have already used freeze this combat!");
    }

    // Apply freeze effect
    await db.set("freeze_used_this_combat", true);
    await db.set("monsters_frozen_this_turn", true);
    await db.set(`user_freeze_used_${userId}_${ptt.currentBattleTurn}`, true);

    const embed = new Discord.EmbedBuilder()
        .setTitle("🧊 FREEZE ACTIVATED!")
        .setColor("#0099FF")
        .setDescription(`${user.username}'s Blue Crystal glows with icy power!`)
        .addFields(
            { name: "Effect", value: "Monsters are frozen solid and cannot attack this turn!", inline: false },
            { name: "Duration", value: "This turn only", inline: true },
            { name: "Limitation", value: "One freeze per combat", inline: true }
        )
        .setFooter({ text: "Blue Crystal ability used" });

    message.channel.send({ embeds: [embed] });
    message.channel.send("❄️ **The battlefield freezes!** All monsters are encased in ice and unable to move this turn!");
};

module.exports.help = {
    name: "freeze",
    aliases: ["ice", "stop"]
};
