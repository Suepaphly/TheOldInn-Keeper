
const constants = require('../config/constants.js');
const logger = require('./logger.js');

class Validator {
  static isValidAmount(amount, min = 1, max = constants.ECONOMY.MAX_BET) {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= min && num <= max && Number.isInteger(num);
  }

  static isValidUser(user) {
    return user && user.id && typeof user.id === 'string';
  }

  static isValidBet(amount) {
    return this.isValidAmount(amount, constants.ECONOMY.MIN_BET, constants.ECONOMY.MAX_BET);
  }

  static isValidPayAmount(amount) {
    return this.isValidAmount(amount, constants.ECONOMY.MIN_PAY, constants.ECONOMY.MAX_PAY);
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().slice(0, constants.VALIDATION.REASON_MAX_LENGTH);
  }

  static validateCommand(message, args, expectedArgCount = null) {
    const errors = [];

    // Check if user is valid
    if (!this.isValidUser(message.author)) {
      errors.push('Invalid user');
    }

    // Check if in guild
    if (!message.guild) {
      errors.push('Command must be used in a server');
    }

    // Check args length
    if (expectedArgCount !== null && args.length !== expectedArgCount) {
      errors.push(`Expected ${expectedArgCount} arguments, got ${args.length}`);
    }

    // Check args length limit
    if (args.length > constants.VALIDATION.MAX_ARGS_LENGTH) {
      errors.push('Too many arguments provided');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateEconomyAction(amount, userBalance, actionType = 'spend') {
    const errors = [];
    const numAmount = parseFloat(amount);

    if (!this.isValidAmount(amount)) {
      errors.push(constants.ERRORS.INVALID_AMOUNT);
      return { isValid: false, errors, amount: 0 };
    }

    if (actionType === 'spend' && numAmount > userBalance) {
      errors.push(constants.ERRORS.INSUFFICIENT_FUNDS);
    }

    if (numAmount > constants.ECONOMY.MAX_BET) {
      errors.push(constants.ERRORS.AMOUNT_TOO_HIGH);
    }

    if (numAmount < constants.ECONOMY.MIN_BET) {
      errors.push(constants.ERRORS.AMOUNT_TOO_LOW);
    }

    return {
      isValid: errors.length === 0,
      errors,
      amount: numAmount
    };
  }

  static logValidationError(userId, command, errors) {
    logger.warn(`Validation failed for command ${command}`, userId, command);
    errors.forEach(error => {
      logger.warn(`Validation error: ${error}`, userId, command);
    });
  }
}

module.exports = Validator;
