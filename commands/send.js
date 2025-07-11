
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send(
            "⚔️ The town is under attack! All civilian activities are suspended until the battle ends.",
        );
    }

    const user = message.author;
    const target = message.mentions.users.first();
    const item = args[1];

    if (!target) {
        return message.channel.send(
            "❌ You must mention a user to send an item to! Usage: `=send @user [item]`",
        );
    }

    if (!item) {
        return message.channel.send(
            "❌ You must specify an item to send! Usage: `=send @user [item]`",
        );
    }

    if (target.id === user.id) {
        return message.channel.send("❌ You cannot send items to yourself!");
    }

    if (target.bot) {
        return message.channel.send("❌ You cannot send items to bots!");
    }

    const itemLower = item.toLowerCase();

    const weapons = {
        knife: { name: "Knife" },
        sword: { name: "Sword" },
        pistol: { name: "Pistol" },
        shotgun: { name: "Shotgun" },
        rifle: { name: "Rifle" },
    };

    const armor = {
        cloth: { name: "Cloth Armor" },
        leather: { name: "Leather Armor" },
        chainmail: { name: "Chainmail Armor" },
        studded: { name: "Studded Armor" },
        plate: { name: "Plate Armor" },
    };

    if (weapons[itemLower]) {
        const userWeaponCount = (await db.get(`weapon_${itemLower}_${user.id}`)) || 0;
        if (userWeaponCount <= 0) {
            return message.channel.send(
                `❌ You don't have any ${weapons[itemLower].name} to send!`,
            );
        }

        await db.sub(`weapon_${itemLower}_${user.id}`, 1);
        await db.add(`weapon_${itemLower}_${target.id}`, 1);

        const embed = new Discord.EmbedBuilder()
            .setTitle("🎁 Item Sent!")
            .setColor("#00FF00")
            .setDescription(
                `${user.username} sent a ${weapons[itemLower].name} to ${target.username}!`,
            )
            .addFields(
                {
                    name: "Sender",
                    value: `<@${user.id}>`,
                    inline: true,
                },
                {
                    name: "Recipient",
                    value: `<@${target.id}>`,
                    inline: true,
                },
                {
                    name: "Item",
                    value: `⚔️ ${weapons[itemLower].name}`,
                    inline: true,
                },
            );

        message.channel.send({ embeds: [embed] });
    } else if (armor[itemLower]) {
        const userArmorCount = (await db.get(`armor_${itemLower}_${user.id}`)) || 0;
        if (userArmorCount <= 0) {
            return message.channel.send(
                `❌ You don't have any ${armor[itemLower].name} to send!`,
            );
        }

        await db.sub(`armor_${itemLower}_${user.id}`, 1);
        await db.add(`armor_${itemLower}_${target.id}`, 1);

        const embed = new Discord.EmbedBuilder()
            .setTitle("🎁 Item Sent!")
            .setColor("#00FF00")
            .setDescription(
                `${user.username} sent ${armor[itemLower].name} to ${target.username}!`,
            )
            .addFields(
                {
                    name: "Sender",
                    value: `<@${user.id}>`,
                    inline: true,
                },
                {
                    name: "Recipient",
                    value: `<@${target.id}>`,
                    inline: true,
                },
                {
                    name: "Item",
                    value: `🛡️ ${armor[itemLower].name}`,
                    inline: true,
                },
            );

        message.channel.send({ embeds: [embed] });
    } else {
        message.channel.send(
            `❌ Item not found! Available items: knife, sword, pistol, shotgun, rifle, cloth, leather, chainmail, studded, plate`,
        );
    }
};

module.exports.help = {
    name: "send",
    aliases: ["give", "transfer"],
};
