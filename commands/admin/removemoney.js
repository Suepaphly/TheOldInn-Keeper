const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("./config.json");

module.exports.run = async (bot, message, args) => {
  const ownerID = [
    "367445249376649217"
  ];
  if (!ownerID.includes(message.author.id)) return;

  let user = message.mentions.members.first() || message.author;

    if (isNaN(args[1])) return;
    await db.sub(`money_${user.id}`, args[1])
    let bal = await db.get(`money_${user.id}`)

  message.channel.send(`Taken \`${args[1]}\` kopeks from **${user}**'s balance.\n> Current balance: \`${bal}\` kopeks.`)

};


module.exports.help = {
  name:"removemoney",
  aliases: ["tax", "removecredits", "takemoney", "takecredits"]
}