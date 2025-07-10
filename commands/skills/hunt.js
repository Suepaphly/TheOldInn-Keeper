const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const mg = require("../../utility/utility.js");

module.exports.run = async (client, message, args) => {
  // Check if town is under attack
  const ptt = require("../utility/protectTheTavern.js");
  if (ptt.lockArena) {
    return message.channel.send(
      "⚔️ The town is under attack! All civilian activities are suspended until the battle ends."
    );
  }

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
  let author = await db.get(`hunt_${user.id}`);
  let userlevel = await db.get(`huntinglevel_${user.id}`);

  let timeout = 3600000;

  if (author !== null && timeout - (Date.now() - author) > 0) {
    let time = ms(timeout - (Date.now() - author));

    message.channel.send(
      `**${message.author.username}**, you already hunted recently, try again in \`${time.minutes} minutes, ${time.seconds} seconds\`.`
    );
  } else {
    let rarehunt = [
      "**🦃 `(Turkey)`**",
      "**🐃 `(Water Buffalo)`**",
      "**:bison: `(Bison)`**",
      "**:zebra: `(Zebra)`**",
      "**:kangaroo: `(Kangaroo)`**",
    ];

    let bighunt = [
      "**:sheep: `(Sheep)`**",
      "**🐂 `(Ox)`**",
      "**🐄 `(Cow)`**",
      "**🐖 `(Pig)`**",
      "**:deer: `(Deer)`**",
    ];

    let hunt = [
      "**🐰 `(Rabbit)`**",
      "**🐔 `(Chicken)`**",
      "**🐍 `(Snake)`**",
      "**:goat: `(Goat)`**",
      "**:duck:  `(Duck)`**",
    ];

    let trash = [
      "**🐰 `(Rabbit)`**",
      "**🐸 `(Frog)`**",
      "**🐓 `(Rooster)`**",
      "**🐿 `(Chipmunk)`**",
      "**:rat: `(Rat)`**",
    ];

    var fisharray = [trash, hunt, bighunt, rarehunt];
    var fishresult;

    if (userlevel != null) {
      fishresult = mg.skillMinigame("hunt", userlevel);
    } else {
      fishresult = mg.skillMinigame("hunt", 0);
    }

    message.channel.send(
      `**HUNT MINIGAME:** - 🏹\n**<@${message.author.id}>** has hunted a ${
        fisharray[fishresult[0]][fishresult[1]]
      } and earned \`${fishresult[2]}\` kopeks.`
    );

    // Update the user's money
    let currentMoney = await db.get(`money_${user.id}`);
    await db.set(`money_${user.id}`, currentMoney + fishresult[2]);
    // Set the time of the last hunt
    await db.set(`hunt_${user.id}`, Date.now());
  }
};

module.exports.help = {
  name: "hunt",
  aliases: [],
};