const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const mg = require("../utility/utility.js");
const constants = require("../config/constants.js");
const logger = require("../utility/logger.js");
const Validator = require("../utility/validation.js");
const ErrorHandler = require("../utility/errorHandler.js");

module.exports.run = async (client, message, args) => {
    // Input validation
    const validation = Validator.validateCommand(message, args, 0);
    if (!validation.isValid) {
        await ErrorHandler.handleValidationError(validation.errors, message, 'fish');
        return;
    }

    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        await message.channel.send(constants.ERRORS.TOWN_UNDER_ATTACK);
        return;
    }

  let ms;
  try {
    ms = (await import("parse-ms")).default;
  } catch (error) {
    console.error("Failed to import parse-ms", error);
    return message.channel.send("❌ Failed to import `parse-ms` library. Please report this to the developers.");
  }

  const member =
    message.mentions.members.first() ||
    message.guild.members.cache.get(args[0]) ||
    message.member;
  let user = message.author;
  let author, userlevel;
  
  try {
    author = await db.get(`fish_${user.id}`);
    userlevel = await db.get(`fishinglevel_${user.id}`);
  } catch (error) {
    await ErrorHandler.handleDatabaseError(error, user.id, 'fetch fish data');
    return;
  }

  const timeout = constants.COOLDOWNS.FISH;

  if (author !== null && Date.now() - author < timeout) {
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

    try {
      if (userlevel != null) {
        fishresult = mg.skillMinigame("fish", userlevel);
      } else {
        fishresult = mg.skillMinigame("fish", 0);
      }

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

      const fishedItem = fisharray[categoryIndex][itemIndex];

      await message.channel.send(
        `**FISH MINIGAME:** - 🎣\n<@${user.id}>, you fished a ${fishedItem} and earned \`${reward}\` kopeks.`
      );

      // Update database with error handling
      try {
        await db.add(`money_${user.id}`, reward);
        await db.set(`fish_${user.id}`, Date.now());
        
        logger.economy('fish', user.id, reward, true);
      } catch (error) {
        await ErrorHandler.handleDatabaseError(error, user.id, 'update fish rewards');
        return;
      }

    } catch (error) {
      logger.error("Fishing minigame failed", error, user.id, 'fish');
      await message.channel.send(
        `**FISH MINIGAME:** - 🎣\n<@${user.id}>, something went wrong with your fishing attempt! Please try again.`
      );
    }
  }
};
module.exports.help = {
  name: "fish",
  aliases: [],
};