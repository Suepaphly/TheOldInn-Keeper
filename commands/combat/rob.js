const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (bot, message, args) => {
    // Import parse-ms dynamically
    let ms;
    try {
        ms = (await import("parse-ms")).default;
    } catch (error) {
        console.error("Failed to import parse-ms", error);
        return;
    }

    let user = message.mentions.members.first();
    if (!user || user.id === message.author.id) {
        if (!args[0]) {
            let moneyData = await db.all();
            let topWallets = moneyData
                .filter(item => item.id.startsWith("money_"))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            let leaderboardStrings = [];
            for (let i = 0; i < topWallets.length; i++) {
                try {
                    let userId = topWallets[i].id.split('_')[1];
                    let user = await bot.users.fetch(userId);
                    let formattedAmount = topWallets[i].value.toLocaleString();
                    leaderboardStrings.push(`${i + 1}. **${user.tag}** => ${formattedAmount}\n`);
                } catch (error) {
                    console.error(`Failed to fetch user ${topWallets[i].id}:`, error);
                }
            }

            message.channel.send(`**${message.guild.name} Kopek Leaderboard (In Wallet)**\n\n${leaderboardStrings.join('')}`);
        } else {
            message.channel.send("Wrong usage, mention someone to rob that isn't yourself.");
        }
        return;
    }

    let [targetUserMoney, thiefMoney, lastRob] = await Promise.all([
        db.get(`money_${user.id}`),
        db.get(`money_${message.author.id}`),
        db.get(`rob_${message.author.id}`)
    ]);

    if (lastRob && (3600000 - (Date.now() - lastRob) > 0)) {
        let time = ms(3600000 - (Date.now() - lastRob));
        message.channel.send(`**${message.author.username}**, you already robbed someone recently, try again in \`${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds\`.`);
        return;
    }

    if (user.id === "853832646970310677") { // Assuming this is a specific user to not rob
        message.channel.send(`:pirate_flag: ${message.author.username}, you can't rob the Ol' Innkeeper! Who would run the Inn?!`);
        return;
    }

    if (!targetUserMoney) {
        message.channel.send(`:pirate_flag: ${message.author.username}, the target needs to have some kopeks to rob.`);
        return;
    }

    let thiefLevel = await db.get(`thieflevel_${message.author.id}`) || 0;
    let robChance = [52, 60, 70, 80, 90, 95][thiefLevel];
    let robAmt = [20, 30, 40, 50, 60, 70][thiefLevel];
    let perc = (Math.floor(Math.random() * robAmt) + 1) * 0.01;
    let kopek = Math.floor(targetUserMoney * perc);
    let caught = Math.floor(Math.random() * 100);

    if (caught > (100 - robChance)) {
        message.channel.send(`:ninja: ${message.author.username}, you robbed ${user.user.username} and got away with ${kopek} kopeks`);
        await db.sub(`money_${user.id}`, kopek);
        await db.add(`money_${message.author.id}`, kopek);
    } else {
        let penalty = thiefMoney ? Math.min(thiefMoney, Math.floor(thiefMoney * perc)) : 0;
        if (penalty > 0) {
            message.channel.send(`:ninja: ${message.author.username}, you got caught by the town guard and were forced to pay ${penalty} kopeks restitution to ${user.user.username}.`);
            await db.sub(`money_${message.author.id}`, penalty);
            await db.add(`money_${user.id}`, penalty);
        } else {
            message.channel.send(`:ninja: ${message.author.username}, you got caught by the town guard but had no money to pay restitution. You were given a stern warning instead.`);
        }
    }

    await db.set(`rob_${message.author.id}`, Date.now());
};



module.exports.help = {
  name:"rob",
  aliases: ["rob", "steal", "pillage"]
}