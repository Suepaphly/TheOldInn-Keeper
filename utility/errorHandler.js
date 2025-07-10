
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

  static categorizeError(error) {
    if (error.message.includes('QuickDB') || error.message.includes('database')) {
      return 'DATABASE';
    }
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'NETWORK';
    }
    if (error.message.includes('permission') || error.message.includes('forbidden')) {
      return 'PERMISSION';
    }
    if (error.message.includes('timeout') || error.message.includes('time')) {
      return 'TIMEOUT';
    }
    if (error.message.includes('parse') || error.message.includes('invalid')) {
      return 'VALIDATION';
    }
    return 'UNKNOWN';
  }

  static async handleCriticalError(error, context) {
    const category = this.categorizeError(error);
    logger.error(`Critical error [${category}]: ${error.message}`, error, null, context);
    
    // In a production environment, you might want to:
    // - Send alerts to administrators
    // - Restart certain services
    // - Implement circuit breakers
    
    console.error(`CRITICAL ERROR in ${context}:`, error);
  }

  static async tryRecovery(error, operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        return await operation();
      } catch (retryError) {
        logger.warn(`Recovery attempt ${i + 1} failed`, null, 'error-recovery');
        if (i === maxRetries - 1) {
          throw retryError;
        }
      }
    }
  }
}

module.exports = ErrorHandler;
