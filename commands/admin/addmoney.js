const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("../../config.json");

exports.run = async (client, message, args) => {
    if (message.author.id !== config.ownerID) {
        message.channel.send("You do not have permission to use this command.");
        return;
    }

    let user = message.mentions.members.first() || message.author;

    if (isNaN(args[1])) {
        message.channel.send("Please specify a valid number of kopeks to add.");
        return;
    }

    // Ensure args[1] is converted to a number, and use db.add
    let amountToAdd = parseInt(args[1], 10); // Convert the second argument to a number safely
    await db.add(`money_${user.id}`, amountToAdd); // Adding the amount to user's money
    let bal = await db.get(`money_${user.id}`); // Get the new balance after adding

    message.channel.send(`Added \`${amountToAdd}\` kopeks to **${message.author.username}**'s balance.\n> Current balance: \`${bal}\` kopeks.`);
};

module.exports.help = {
    name: "addmoney",
    aliases: ["addcredits", "addkopeks"]
};