const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();  

module.exports.run = async (client, message, args) => {
    let user = message.mentions.members.first() || message.author;
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

    let bal = await db.get(`money_${user.id}`);
    let bbal = await db.get(`bank_${user.id}`);

    // Default to 0 if null
    if (bal === null) bal = 0;
    if (bbal === null) bbal = 0;

    message.channel.send(`**${member.user.tag}** Wallet: \`${bal}\` kopeks; Bank: \`${bbal}\``);
}; 

module.exports.help = {
    name: "balance",
    aliases: ["bal", "credits", "money", "wallet"]
};
