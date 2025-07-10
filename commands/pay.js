const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const constants = require("../config/constants.js");
const logger = require("../utility/logger.js");
const Validator = require("../utility/validation.js");
const ErrorHandler = require("../utility/errorHandler.js");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    // Input validation
    const validation = Validator.validateCommand(message, args, 2);
    if (!validation.isValid) {
        await ErrorHandler.handleValidationError(validation.errors, message, 'pay');
        return;
    }

    const [userMention, amountStr] = args;
    
    // Validate user mention
    const targetUser = message.mentions.users.first();
    if (!targetUser || !Validator.isValidUser(targetUser)) {
        await message.channel.send(`${constants.EMOJIS.ERROR} Please mention a valid user.`);
        return;
    }

    // Validate amount
    const economyValidation = Validator.validateEconomyAction(amountStr, 0, 'pay');
    if (!economyValidation.isValid) {
        await ErrorHandler.handleValidationError(economyValidation.errors, message, 'pay');
        return;
    }

    const amount = economyValidation.amount;

    // Check pay amount limits
    if (!Validator.isValidPayAmount(amount)) {
        await message.channel.send(`${constants.EMOJIS.ERROR} Pay amount must be between ${constants.ECONOMY.MIN_PAY} and ${constants.ECONOMY.MAX_PAY} kopeks.`);
        return;
    }
    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const { QuickDB } = require("quick.db");
    const db = new QuickDB();

  // Import parse-ms dynamically
  let ms;
  try {
    ms = (await import("parse-ms")).default;
  } catch (error) {
    console.error("Failed to import parse-ms", error);
    return;
  }

  let user = message.mentions.members.first() || message.author;

  // Fetching money amount asynchronously
  let memberMoney = await db.get(`money_${message.author.id}`);

  // Validate mentioned user and argument presence
  if (!user) {
      return message.channel.send(`Wrong usage, mention someone to give kopeks.`);
  }

  if (!args[1]) {
      return message.channel.send(`Wrong usage, specify an amount to give kopeks.`);
  }

  const amount = parseInt(args[1], 10);
  if (isNaN(amount) || amount <= 0) {
      return message.channel.send(`Wrong usage, the amount must be a positive number.`);
  }

  if (message.content.includes('-')) { 
      return message.channel.send(`Wrong usage, you can't pay someone negative kopeks.`);
  }

  if (memberMoney < amount) {
      return message.channel.send(`Wrong usage, you don't have that much kopeks.`);
  }

  // Execute the monetary transaction
  await db.sub(`money_${message.author.id}`, amount);
  await db.add(`money_${user.id}`, amount);

  message.channel.send(`You transferred \`${amount}\` kopeks to **${user.user.username}**'s balance.`);
}

module.exports.help = {
  name:"pay",
  aliases: ["transfer", "givemoney"]
}