const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

exports.run = async (client, message, args) => {
    let ms;
    try {
        ms = (await import("parse-ms")).default;
    } catch (error) {
        console.error("Failed to import parse-ms", error);
        return;
    }

    let user = message.author;
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

    // Replace fetch with get and handle asynchronously
    let wbal = await db.get(`money_${user.id}`);
    let bbal = await db.get(`bank_${user.id}`);
    if (bbal === null) bbal = 0;
    let deposit = Math.floor(Math.abs(parseInt(args[0])));

    let timer = await db.get(`deposit_${user.id}`);
    let timeout = 21600000;

    if (!deposit || deposit === 0) {
        message.channel.send(`**<@${user.id}>'s Bank Balance: ${bbal}**`);
    } else if (timeout - (Date.now() - timer) > 9000) {
        let time = ms(timeout - (Date.now() - timer));
        message.channel.send(`Bank Balance: ${bbal} **${member.user.tag}**, try again in \`${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds\`.`);
    } else {
        if (deposit <= wbal) {
            // Replace subtract with sub and handle asynchronously
            await db.sub(`money_${user.id}`, deposit);
            await db.add(`bank_${user.id}`, deposit);
            let newbal = await db.get(`bank_${user.id}`);
            await db.set(`deposit_${user.id}`, Date.now());
            message.channel.send(`**<@${user.id}>** just deposited '${deposit}' into their bank. Their new bank balance is '${newbal}'`);
        } else {
            message.channel.send(`${user.username}, please send a valid amount of Kopeks.`);
        }
    }
};

module.exports.help = {
    name: "bank",
    aliases: ["bank", "deposit"]
};
