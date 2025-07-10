const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const mg = require("../utility/utility.js");

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
  let author = await db.get(`gather_${user.id}`);
  let userlevel = await db.get(`gatheringlevel_${user.id}`);

  let timeout = 900000;

  if (author !== null && timeout - (Date.now() - author) > 9000) {
    let time = ms(timeout - (Date.now() - author));

    message.channel.send(
      `**<@${message.author.id}>**, you already gathered recently, try again in \`${time.minutes} minutes, ${time.seconds} seconds\`.`
    );
  } else {
    let rarefish = [
      "**:mushroom:`(Mushroom)`**",
      "**:onion:`(Onion)`**",
      "**:garlic:`(Garlic)`**",
      "**:bell_pepper:`(Bell Pepper)`**",
      "**:avocado:`(Avocado)`**",
    ];

    let bigfish = [
      "**:potato:`(Potato)`**",
      "**:hot_pepper:`(Cayenne Pepper)`**",
      "**:eggplant:`(Eggplant)`**",
      "**:melon:`(Melon)`**",
      "**:tomato:`(Tomato)`**",
    ];

    let fish = [
      "**:cucumber:`(Cucumber)`**",
      "**:kiwi:`(Kiwi)`**",
      "**:apple:`(Apple)`**",
      "**:strawberry:`(Strawberry)`**",
      "**:blueberries:`(Blueberry)`**",
    ];

    let trash = [
      "**:corn:`(Corn)`**",
      "**:leafy_green:`(Lettuce)`**",
      "**:coconut:`(Coconut)`**",
      "**:lemon:`(Lemon)`**",
      "**:olive: `(Olive)`**",
    ];

    var fisharray = [trash, fish, bigfish, rarefish];
    var fishresult;

    if (userlevel != null) {
      fishresult = mg.skillMinigame("gather", userlevel);
    } else {
      fishresult = mg.skillMinigame("gather", 0);
    }

    if (!args[0]) {
      message.channel.send(
        `**GATHERING MINIGAME:** - :basket: \n**<@${message.author.id}>** gathered a ${
          fisharray[fishresult[0]][fishresult[1]]
        } and earned \`${fishresult[2]}\` kopeks.`
      );
      // Update the user's money
      let currentMoney = await db.get(`money_${user.id}`);
      await db.set(`money_${user.id}`, currentMoney + fishresult[2]);
      // Set the time of the last gather
      await db.set(`gather_${user.id}`, Date.now());
    }
  }
};

module.exports.help = {
  name: "gather",
  aliases: [],
};