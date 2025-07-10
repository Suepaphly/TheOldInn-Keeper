const slotItems = ["🍇", "🍌", "🍉", "🍋", "🍒", ":peach:", ":pineapple:", ":apple:", ":blueberries:", ":moneybag:", ":coin:", ":gem:"];
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const constants = require("../config/constants.js");
const logger = require("../utility/logger.js");
const Validator = require("../utility/validation.js");
const ErrorHandler = require("../utility/errorHandler.js");

module.exports.run = async (client, message, args) => {
    // Input validation
    const validation = Validator.validateCommand(message, args, 1);
    if (!validation.isValid) {
        await ErrorHandler.handleValidationError(validation.errors, message, 'slots');
        return;
    }

    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        await message.channel.send(constants.ERRORS.TOWN_UNDER_ATTACK);
        return;
    }

    const user = message.author;

    let currentBal;
    try {
        currentBal = await db.get(`money_${user.id}`) || 0;
    } catch (error) {
        await ErrorHandler.handleDatabaseError(error, user.id, 'fetch balance for slots');
        return;
    }

    const betValidation = Validator.validateEconomyAction(args[0], currentBal, 'spend');
    if (!betValidation.isValid) {
        await ErrorHandler.handleValidationError(betValidation.errors, message, 'slots');
        return;
    }

    const bet = betValidation.amount;

    let number = []
    for (i = 0; i < 3; i++) { number[i] = Math.floor(Math.random() * slotItems.length); }

    let winnings = 0;
      if (number[0] == number[1] && number[1] == number[2]) { 
          winnings = bet * 9
      } else if (number[0] == number[1] || number[0] == number[2] || number[1] == number[2] ) { 
          winnings = bet * 3
      }

    let slotsEmbed = new Discord.EmbedBuilder()
        .setTitle(message.author.username + `'s :slot_machine: Slot Machine :slot_machine:` + '\n___')
        .setDescription(`${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]}`)
        .setColor("#363940")
        .setFooter({ text: 'The Tavernkeeper thanks you for playing.' });
    
    try {
        if (winnings > 0) {
            await db.add(`money_${user.id}`, winnings);
            slotsEmbed.addFields(
                { name: "Result", value: `🎉 **YOU WON ${winnings} KOPEKS!** 🎉`, inline: false }
            );
            logger.economy('slots_win', user.id, winnings, true);
        } else {
            await db.sub(`money_${user.id}`, bet);
            slotsEmbed.addFields(
                { name: "Result", value: "💸 Better luck next time!", inline: false }
            );
            logger.economy('slots_loss', user.id, bet, true);
        }

        await message.channel.send({ embeds: [slotsEmbed] });
    } catch (error) {
        await ErrorHandler.handleDatabaseError(error, user.id, 'process slots result');
    }

}

  module.exports.help = {
    name:"slots",
    aliases: ["slots-machine", "slot", "slot-machine", "fruit-machine"]
  }