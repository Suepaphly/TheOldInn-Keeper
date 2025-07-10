const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const { QuickDB } = require("quick.db");
    const db = new QuickDB();

    let ms;
    try {
        ms = (await import("parse-ms")).default;
    } catch (error) {
        console.error("Failed to import parse-ms", error);
        return;
    }

    let user = message.author;
    let timeout = 46000000; // about 12.77 hours
    let amount = 100;

    // Use 'get' instead of 'fetch'
    let daily = await db.get(`daily_${user.id}`);

    if (daily !== null && timeout - (Date.now() - daily) > 0) {
        let time = ms(timeout - (Date.now() - daily));
        message.channel.send(`**${user.username}**, you already received daily kopeks recently, try again in \`${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds\`.`);
    } else {
        message.channel.send(`**<@${message.author.id}>**, you received your \`${amount}\` daily kopeks!`);
        await db.add(`money_${user.id}`, amount); // Ensure this operation completes before proceeding
        await db.set(`daily_${user.id}`, Date.now()); // Ensure this operation completes before proceeding
    }
};

module.exports.help = {
    name: "daily",
    aliases: ["daylies"]
};