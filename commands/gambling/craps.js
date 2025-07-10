const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const ptt = require("../../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const Discord = require("discord.js");
    const { QuickDB } = require("quick.db");
    const db = new QuickDB();

    let ms;
    try {
        ms = (await import("parse-ms")).default;
    } catch (error) {
        console.error("Failed to import parse-ms", error);
        return;
    }

    const member =
        message.mentions.members.first() ||
        message.guild.members.cache.get(args[0]) ||
        message.member;
    const user = message.author;
    let money = Math.abs(parseInt(args[1]));
    const moneydb = await db.get(`money_${message.author.id}`);

    if (args[0] === "all" || args[0] === "max") {
        money = moneydb;
    } else {
        money = parseInt(args[0]);
    }

    if (!money || money < 1 || money > moneydb) {
        message.channel.send("Enter a valid number of kopeks.");
        return;
    }

    if (!moneydb) {
        message.channel.send("You do not have enough kopeks.");
        return;
    }

    const dice1 = Math.floor(Math.random() * (6 - 1) + 1);
    const dice2 = Math.floor(Math.random() * (6 - 1) + 1);
    const total = dice1 + dice2;
    let dicemsg = "";
    let subdice1, subdice2, subtotal;

    if (total === 2 || total === 12 || total === 3) {
        dicemsg = `> You rolled a **${dice1}** and a **${dice2}** for a total of **${total}**. You lose **${money}** kopeks.`;
        await db.set(`money_${message.author.id}`, moneydb - money);
    } else if (total === 7) {
        dicemsg = `> You rolled a **${dice1}** and a **${dice2}** for a total of **${total}**. You win **${money * 5}** kopeks!`;
        await db.set(`money_${message.author.id}`, moneydb + money * 4);
    } else if (total === 11) {
        dicemsg = `> You rolled a **${dice1}** and a **${dice2}** for a total of **${total}**. You win **${money * 2}** kopeks!`;
        await db.set(`money_${message.author.id}`, moneydb + money);
    } else {
        dicemsg = `You rolled a **${dice1}** and a **${dice2}** for a total of **${total}**. Rolling again...`;
        subdice1 = Math.floor(Math.random() * (6 - 1) + 1);
        subdice2 = Math.floor(Math.random() * (6 - 1) + 1);
        subtotal = subdice1 + subdice2;

        dicemsg += `\nYou rolled a **${subdice1}** and a **${subdice2}** for a total of **${subtotal}**.`;

        if (total === subtotal) {
            dicemsg += `\n> You win **${money * 2}** kopeks! :moneybag: :moneybag: :moneybag:`;
            await db.set(`money_${message.author.id}`, moneydb + money);
        } else {
            dicemsg += `\n> You lose **${money}** kopeks.`;
            await db.set(`money_${message.author.id}`, moneydb - money);
        }
    }

    const gambleMessage = `<@${message.author.id}>'s :game_die: :game_die: Craps Game. Good Luck!\n${dicemsg} \n`;
    message.channel.send(gambleMessage);
};

module.exports.help = {
    name: "craps",
    aliases: ["dice"],
};