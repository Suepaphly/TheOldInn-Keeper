const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("../../config.json");
const config = require("./config.json"); // Import the config

module.exports.run = async (client, message, args) => {
    if (!config.ownerID.includes(message.author.id)) {
        return message.channel.send("❌ Only the bot owner can use this command!");
    }

    const target = message.mentions.users.first() || 
                  (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    const item = args[1]?.toLowerCase();
    const amount = parseInt(args[2]) || 1;

    if (!target) {
        return message.channel.send("❌ You must mention a user or provide a user ID! Usage: `=removeitem @user [item] [amount]`");
    }

    if (!item) {
        return message.channel.send("❌ You must specify an item to remove! Usage: `=removeitem @user [item] [amount]`");
    }

    if (amount < 1) {
        return message.channel.send("❌ Amount must be at least 1!");
    }

    const weapons = {
        knife: { name: "Knife" },
        sword: { name: "Sword" },
        pistol: { name: "Pistol" },
        shotgun: { name: "Shotgun" },
        rifle: { name: "Rifle" }
    };

    const armor = {
        cloth: { name: "Cloth Armor" },
        leather: { name: "Leather Armor" },
        chainmail: { name: "Chainmail Armor" },
        studded: { name: "Studded Armor" },
        plate: { name: "Plate Armor" },
        dragonscale: { name: "Dragonscale Armor" }
    };

    const crystals = {
        white: { name: "White Crystal" },
        black: { name: "Black Crystal" },
        red: { name: "Red Crystal" },
        blue: { name: "Blue Crystal" },
        green: { name: "Green Crystal" }
    };

    try {
        let removed = false;
        let itemName = "";
        let currentCount = 0;

        if (weapons[item]) {
            currentCount = await db.get(`weapon_${item}_${target.id}`) || 0;
            if (currentCount >= amount) {
                await db.sub(`weapon_${item}_${target.id}`, amount);
                itemName = weapons[item].name;
                removed = true;
            }
        } else if (armor[item]) {
            currentCount = await db.get(`armor_${item}_${target.id}`) || 0;
            if (currentCount >= amount) {
                await db.sub(`armor_${item}_${target.id}`, amount);
                itemName = armor[item].name;
                removed = true;
            }
        } else if (crystals[item]) {
            currentCount = await db.get(`crystal_${item}_${target.id}`) || 0;
            if (currentCount >= amount) {
                await db.sub(`crystal_${item}_${target.id}`, amount);
                itemName = crystals[item].name;
                removed = true;
            }
        } else {
            return message.channel.send(`❌ Unknown item: ${item}. Valid items: weapons (knife, sword, pistol, shotgun, rifle), armor (cloth, leather, chainmail, studded, plate, dragonscale), crystals (white, black, red, blue, green)`);
        }

        if (!removed) {
            return message.channel.send(`❌ ${target.username} only has ${currentCount} ${itemName || item}(s). Cannot remove ${amount}.`);
        }

        const embed = new Discord.EmbedBuilder()
            .setTitle("🗑️ Item Removed")
            .setColor("#FF6600")
            .setDescription(`Removed ${amount} ${itemName}(s) from ${target.username}`)
            .addFields(
                { name: "Target User", value: target.username, inline: true },
                { name: "Item Removed", value: `${itemName} x${amount}`, inline: true },
                { name: "Removed By", value: message.author.username, inline: true }
            );

        message.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error("Error removing item:", error);
        message.channel.send("❌ An error occurred while trying to remove the item.");
    }
};

module.exports.help = {
    name: "removeitem",
    aliases: ["takeitem", "deleteitem"]
};