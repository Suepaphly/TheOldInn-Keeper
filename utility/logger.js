
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, userId = null, command = null) {
    const timestamp = new Date().toISOString();
    const userInfo = userId ? ` [User: ${userId}]` : '';
    const commandInfo = command ? ` [Command: ${command}]` : '';
    return `[${timestamp}] [${level}]${userInfo}${commandInfo} ${message}`;
  }

  writeToFile(filename, message) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, message + '\n');
  }

  info(message, userId = null, command = null) {
    const formattedMessage = this.formatMessage('INFO', message, userId, command);
    console.log(formattedMessage);
    this.writeToFile('info.log', formattedMessage);
  }

  error(message, error = null, userId = null, command = null) {
    const errorDetails = error ? ` Error: ${error.message || error}` : '';
    const fullMessage = message + errorDetails;
    const formattedMessage = this.formatMessage('ERROR', fullMessage, userId, command);
    console.error(formattedMessage);
    this.writeToFile('error.log', formattedMessage);
  }

  warn(message, userId = null, command = null) {
    const formattedMessage = this.formatMessage('WARN', message, userId, command);
    console.warn(formattedMessage);
    this.writeToFile('warn.log', formattedMessage);
  }

  debug(message, userId = null, command = null) {
    const formattedMessage = this.formatMessage('DEBUG', message, userId, command);
    console.log(formattedMessage);
    this.writeToFile('debug.log', formattedMessage);
  }

  command(commandName, userId, args, success = true) {
    const message = `Command executed: ${commandName} | Args: ${JSON.stringify(args)} | Success: ${success}`;
    this.info(message, userId, commandName);
  }

  economy(action, userId, amount, success = true) {
    const message = `Economy action: ${action} | Amount: ${amount} | Success: ${success}`;
    this.info(message, userId, 'economy');
  }

  combat(action, userId, details) {
    const message = `Combat action: ${action} | Details: ${JSON.stringify(details)}`;
    this.info(message, userId, 'combat');
  }
}

module.exports = new Logger();
