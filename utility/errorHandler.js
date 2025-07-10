
const logger = require('./logger.js');
const constants = require('../config/constants.js');

class ErrorHandler {
  static async handleCommand(commandFunction, client, message, args, commandName) {
    try {
      logger.command(commandName, message.author.id, args, true);
      await commandFunction(client, message, args);
    } catch (error) {
      logger.error(`Command ${commandName} failed`, error, message.author.id, commandName);
      await this.sendErrorMessage(message, error, commandName);
    }
  }

  static async sendErrorMessage(message, error, commandName) {
    let userMessage = constants.ERRORS.COMMAND_ERROR;

    // Handle specific error types
    if (error.message.includes('insufficient funds')) {
      userMessage = constants.ERRORS.INSUFFICIENT_FUNDS;
    } else if (error.message.includes('invalid amount')) {
      userMessage = constants.ERRORS.INVALID_AMOUNT;
    } else if (error.message.includes('cooldown')) {
      userMessage = constants.ERRORS.COOLDOWN_ACTIVE;
    }

    try {
      await message.channel.send(`❌ ${userMessage}`);
    } catch (sendError) {
      logger.error(`Failed to send error message for command ${commandName}`, sendError, message.author.id);
    }
  }

  static async handleDatabaseError(error, userId, action) {
    logger.error(`Database error during ${action}`, error, userId);
    throw new Error(`Database operation failed: ${action}`);
  }

  static async handleValidationError(errors, message, commandName) {
    const errorMessage = errors.length > 0 ? errors[0] : constants.ERRORS.COMMAND_ERROR;
    logger.warn(`Validation error in ${commandName}: ${errors.join(', ')}`, message.author.id, commandName);
    await message.channel.send(`❌ ${errorMessage}`);
  }

  static createSafeWrapper(commandFunction, commandName) {
    return async (client, message, args) => {
      await this.handleCommand(commandFunction, client, message, args, commandName);
    };
  }
}

module.exports = ErrorHandler;
