
<old_str>const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const mg = require("../utility/utility.js");

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const { QuickDB } = require("quick.db");
    const db = new QuickDB();

  let ms;
  try {
    ms = (await import("parse-ms")).default;
  } catch (error) {
    console.error("Failed to import parse-ms", error);
    return;
  }

    let user = message.author;
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

    let bbal = await db.get(`bank_${user.id}`);
    let withdraw = Math.floor(Math.abs(parseInt(args[0])));

    let timer = await db.get(`deposit_${user.id}`)

    if(!withdraw || withdraw === null || withdraw === 0 || args[0] === "all"){ 
            let total = await db.get(`bank_${user.id}`);
            await db.sub(`bank_${user.id}`, total);
            await db.add(`money_${user.id}`, total);
            let newbal = await db.get(`money_${user.id}`);
            message.channel.send(`**${member.user.tag}** just withdrew \'${total}\' into their wallet. Their new wallet balance is \'${newbal}\'`);
    } else {      
        if(withdraw <= bbal) {
            await db.sub(`bank_${user.id}`, withdraw);
            await db.add(`money_${user.id}`, withdraw);
            let newbbal = await db.get(`bank_${user.id}`);
            message.channel.send(`**${member.user.tag}** just withdrew \'${withdraw}\' into their wallet. Their new bank balance is \'${newbbal}\'`);
        } else {
            message.channel.send(`${user.username} Please send a valid amount of Kopeks`);
        }
    }

 }</old_str>
<new_str>const { QuickDB } = require("quick.db");
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
        await ErrorHandler.handleValidationError(validation.errors, message, 'withdraw');
        return;
    }

    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        await message.channel.send(constants.ERRORS.TOWN_UNDER_ATTACK);
        return;
    }

    const user = message.author;
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

    let bbal, walletBalance;
    try {
        bbal = await db.get(`bank_${user.id}`) || 0;
        walletBalance = await db.get(`money_${user.id}`) || 0;
    } catch (error) {
        await ErrorHandler.handleDatabaseError(error, user.id, 'fetch bank balance');
        return;
    }

    if (bbal <= 0) {
        await message.channel.send(`${constants.EMOJIS.ERROR} You have no kopeks in your bank account!`);
        return;
    }

    // Handle "all" or no amount specified
    if (!args[0] || args[0] === "all") {
        try {
            await db.sub(`bank_${user.id}`, bbal);
            await db.add(`money_${user.id}`, bbal);
            const newBalance = walletBalance + bbal;
            
            await message.channel.send(
                `${constants.EMOJIS.SUCCESS} **${member.user.tag}** withdrew \`${bbal}\` kopeks from the bank. Wallet balance: \`${newBalance}\` kopeks.`
            );
            
            logger.economy('withdraw', user.id, bbal, true);
        } catch (error) {
            await ErrorHandler.handleDatabaseError(error, user.id, 'withdraw all funds');
        }
        return;
    }

    // Validate specific amount
    const economyValidation = Validator.validateEconomyAction(args[0], bbal, 'withdraw');
    if (!economyValidation.isValid) {
        await ErrorHandler.handleValidationError(economyValidation.errors, message, 'withdraw');
        return;
    }

    const withdrawAmount = economyValidation.amount;

    if (withdrawAmount > bbal) {
        await message.channel.send(
            `${constants.EMOJIS.ERROR} You only have \`${bbal}\` kopeks in your bank account!`
        );
        return;
    }

    try {
        await db.sub(`bank_${user.id}`, withdrawAmount);
        await db.add(`money_${user.id}`, withdrawAmount);
        const newBankBalance = bbal - withdrawAmount;
        
        await message.channel.send(
            `${constants.EMOJIS.SUCCESS} **${member.user.tag}** withdrew \`${withdrawAmount}\` kopeks. Bank balance: \`${newBankBalance}\` kopeks.`
        );
        
        logger.economy('withdraw', user.id, withdrawAmount, true);
    } catch (error) {
        await ErrorHandler.handleDatabaseError(error, user.id, 'withdraw funds');
    }
}</new_str>
