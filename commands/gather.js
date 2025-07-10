const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const mg = require("../utility/utility.js");
const constants = require('../constants/constants.js');
const ErrorHandler = require('../utility/error-handler');
const Validator = require('../utility/validator');
const logger = require('../utility/logger');

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
  let author, userlevel;
    try {
        author = await db.get(`gather_${user.id}`);
        userlevel = await db.get(`gatheringlevel_${user.id}`);
    } catch (error) {
        await ErrorHandler.handleDatabaseError(error, user.id, 'fetch gather data');
        return;
    }

  const timeout = constants.COOLDOWNS.GATHER;

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

    try {
        let fishresult = mg.skillMinigame("gather", userlevel || 0);

        // Enhanced validation of minigame result
        if (!fishresult || !Array.isArray(fishresult) || fishresult.length < 3) {
            throw new Error("Invalid minigame result");
        }

        const [categoryIndex, itemIndex, reward] = fishresult;

        if (categoryIndex < 0 || categoryIndex >= fisharray.length ||
            itemIndex < 0 || itemIndex >= fisharray[categoryIndex].length ||
            !Validator.isValidAmount(reward, 0, constants.ECONOMY.MAX_BET)) {
            throw new Error("Invalid minigame result values");
        }

        const gatheredItem = fisharray[categoryIndex][itemIndex];

        await message.channel.send(
            `**GATHERING MINIGAME:** - :herb:\n<@${user.id}>, you gathered ${gatheredItem} and earned \`${reward}\` kopeks.`
        );

        // Update database with error handling
        try {
            await db.add(`money_${user.id}`, reward);
            await db.set(`gather_${user.id}`, Date.now());

            logger.economy('gather', user.id, reward, true);
        } catch (error) {
            await ErrorHandler.handleDatabaseError(error, user.id, 'update gather rewards');
            return;
        }

    } catch (error) {
        logger.error("Gathering minigame failed", error, user.id, 'gather');
        await message.channel.send(
            `**GATHERING MINIGAME:** - :herb:\n<@${user.id}>, something went wrong with your gathering attempt! Please try again.`
        );
    }
  }
};

module.exports.help = {
  name: "gather",
  aliases: [],
};