const Discord = require("discord.js");
const db = require("quick.db");

exports.run = async (client, message, args) => {
  let ms;
  try {
    ms = (await import("parse-ms")).default;
  } catch (error) {
    console.error("Failed to import parse-ms", error);
    return;
  }

  let user = message.author;
  const member =
    message.mentions.members.first() ||
    message.guild.members.cache.get(args[0]) ||
    message.member;

  let wbal = db.fetch(`money_${user.id}`);
  let bbal = db.fetch(`bank_${user.id}`);
  let deposit = Math.floor(Math.abs(parseInt(args[0])));

  let timer = await db.fetch(`deposit_${user.id}`);
  let timeout = 21600000;

  if (!deposit || deposit === null || deposit === 0) {
    message.channel.send(`**${user.username} Bank Balance: ${bbal}**`);
  } else if (timeout - (Date.now() - timer) > 9000) {
    let time = ms(timeout - (Date.now() - timer));
    message.channel.send(
      `Bank Balance: ${bbal} **${member.user.tag}**, try again in \`${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds\`.`,
    );
  } else {
    if (deposit <= wbal) {
      db.subtract(`money_${user.id}`, deposit);
      db.add(`bank_${user.id}`, deposit);
      let newbal = db.fetch(`bank_${user.id}`);
      db.set(`deposit_${user.id}`, Date.now());
      message.channel.send(
        `**${member.user.tag}** just deposited '${deposit}' into their bank. Their new bank balance is '${newbal}'`,
      );
    } else {
      message.channel.send(
        `${user.username}, please send a valid amount of Kopeks.`,
      );
    }
  }
};

module.exports.help = {
  name: "bank",
  aliases: ["bank", "deposit"],
};
