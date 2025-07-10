
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

  static sanitizeString(input, maxLength = constants.VALIDATION.REASON_MAX_LENGTH) {
    if (typeof input !== 'string') return '';
    
    // Remove potential code injection attempts
    const sanitized = input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .slice(0, maxLength);
    
    return sanitized;
  }

  static isValidDiscordId(id) {
    return typeof id === 'string' && /^\d{17,19}$/.test(id);
  }

  static isValidChannelName(name) {
    return typeof name === 'string' && /^[a-z0-9_-]+$/.test(name) && name.length <= 100;
  }

  static validateRateLimit(userId, command, maxAttempts = 5, windowMs = 60000) {
    // This would typically use Redis or similar for production
    // For now, we'll use a simple in-memory store
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }

    const key = `${userId}:${command}`;
    const now = Date.now();
    const userAttempts = this.rateLimitStore.get(key) || [];
    
    // Clean old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      logger.security('Rate limit exceeded', userId, { command, attempts: recentAttempts.length });
      return false;
    }
    
    recentAttempts.push(now);
    this.rateLimitStore.set(key, recentAttempts);
    
    return true;
  }

  static validateCommandPermissions(user, command) {
    // Define admin-only commands
    const adminCommands = ['addmoney', 'removemoney', 'removestuff', 'resetcooldown', 'startNewGame'];
    
    if (adminCommands.includes(command)) {
      // In a real implementation, you'd check actual permissions
      // For now, we'll assume the command handles its own permission checking
      return true;
    }
    
    return true;
  }
}

module.exports = Validator;
