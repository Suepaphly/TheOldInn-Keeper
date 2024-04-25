const Discord = require("discord.js");
const db = require("quick.db");

module.exports.run = async (client, message, args) => {

  let ms;
  try {
    ms = (await import("parse-ms")).default;
  } catch (error) {
    console.error("Failed to import parse-ms", error);
    return;
  }

  let user = message.author;

  let timeout = 46000000;
  let amount = 100;

   let daily = await db.fetch(`daily_${user.id}`);

  if (daily !== null && timeout - (Date.now() - daily) > 0) {
    let time = ms(timeout - (Date.now() - daily));
  
    message.channel.send(`**${user.username}**, daily kopeks reset in \`${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds\`.`)
  } else {

  message.channel.send(`**${user.username}**, you received your \`${amount}\` daily kopeks!`)

  db.add(`money_${user.id}`, amount)
  db.set(`daily_${user.id}`, Date.now())

  }
};

module.exports.help = {
  name:"daily",
  aliases: ["daylies"]
}
