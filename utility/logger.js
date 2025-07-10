
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

  performance(action, duration, userId = null) {
    const message = `Performance: ${action} took ${duration}ms`;
    this.info(message, userId, 'performance');
  }

  security(action, userId, details = {}) {
    const message = `Security event: ${action} | Details: ${JSON.stringify(details)}`;
    this.warn(message, userId, 'security');
    this.writeToFile('security.log', this.formatMessage('SECURITY', message, userId, 'security'));
  }

  validation(field, value, userId, command) {
    const message = `Validation failed: ${field} = ${value}`;
    this.warn(message, userId, command);
  }

  async cleanOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    try {
      const files = fs.readdirSync(this.logDir);
      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned old log file: ${file}`);
        }
      }
    } catch (error) {
      this.error('Failed to clean old logs', error);
    }
  }
}

module.exports = new Logger();
