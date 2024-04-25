const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const mg = require("../utility/utility.js");

module.exports.run = async (client, message, args) => {
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
  let user = message.author;
  let author = await db.get(`fish_${user.id}`);
  let userlevel = await db.get(`fishinglevel_${user.id}`);

  let timeout = 1800000;

  if (author !== null && timeout - (Date.now() - author) > 9000) {
    let time = ms(timeout - (Date.now() - author));

    message.channel.send(
      `**${member.user.tag}**, you already fished recently, try again in \`${time.minutes} minutes, ${time.seconds} seconds\`.`,
    );
  } else {
    let rarefish = [
      "**🐡`(Blow Fish)`**",
      "**👑`(Crown)`**",
      "**💍`(Ring)`**",
      "**🐋`(Whale)`**",
      "**🦞`(Lobster)`**",
    ];

    let bigfish = [
      "**🐬`(Dolphin)`**",
      "**🦈`(Shark)`**",
      "**🦑`(Squid)`**",
      "**🐙`(Octopus)`**",
      "**🐊`(Crocodile)`**",
    ];

    let fish = [
      "**🐠`(Tropical Fish)`**",
      "**🐟`(Fish)`**",
      "**🦐`(Shrimp)`**",
      "**🦀`(Crab)`**",
      "**🐢`(Turtle)`**",
    ];

    let trash = [
      "**👕`(Shirt)`**",
      "**👟`(Shoe)`**",
      "**🪖`(Helmet)`**",
      "**🧢`(Hat)`**",
      "**🩴`(Sandal)`**",
    ];

    var fisharray = [trash, fish, bigfish, rarefish];
    var fishresult;

    if (userlevel != null) {
      fishresult = mg.skillMinigame("fish", userlevel);
    } else {
      fishresult = mg.skillMinigame("fish", 0);
    }

    if (!args[0]) {
      message.channel.send(
        `**FISH MINIGAME:** - 🎣\n**${member.user.tag}** fished a ${fisharray[fishresult[0]][fishresult[1]]} and earned \`${fishresult[2]}\` kopeks.`,
      );
      // Update the user's money
      let currentMoney = await db.get(`money_${user.id}`);
      await db.set(`money_${user.id}`, currentMoney + fishresult[2]);
      // Set the time of the last fish
      await db.set(`fish_${user.id}`, Date.now());
    }
  }
};
module.exports.help = {
  name: "fish",
  aliases: [],
};
