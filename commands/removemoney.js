const Discord = require("discord.js");
const db = require("quick.db");

module.exports.run = async (bot, message, args) => {
  const ownerID = [
    "367445249376649217"
  ];
  if (!ownerID.includes(message.author.id)) return;

  let user = message.mentions.members.first() || message.author;

    if (isNaN(args[1])) return;
    db.subtract(`money_${user.id}`, args[1])
    let bal = await db.fetch(`money_${user.id}`)

  message.channel.send(`Taken \`${args[1]}\` kopeks from **${user}**'s balance.\n> Current balance: \`${bal}\` kopeks.`)

};


module.exports.help = {
  name:"removemoney",
  aliases: ["removecredits", "takemoney", "takecredits"]
}
