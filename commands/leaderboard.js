const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (bot, message, args) => {
    // Fetch all entries
    const allEntries = await db.all();

    // Filter entries that start with "bank_" and have a positive value, then map them into [key, value] format
    const bankEntries = allEntries
        .filter(entry => entry.id.startsWith("bank_") && entry.value && entry.value > 0)
        .map(entry => [entry.id, entry.value]);

    // Sort the bank entries by value in descending order
    bankEntries.sort((a, b) => b[1] - a[1]);

    let content = "";
    const maxEntries = Math.min(bankEntries.length, 5);
    
    if (bankEntries.length === 0) {
        content = "No users have deposited money to their bank accounts yet!";
        message.channel.send(`**${message.guild.name} Kopek Leaderboard (In Bank)**\n\n${content}`);
        return;
    }

    for (let i = 0; i < maxEntries; i++) {
        const [key, amount] = bankEntries[i];
        const userId = key.split('_')[1];
        
        // Check if user is in the current server
        const member = message.guild.members.cache.get(userId);
        if (!member) {
            continue; // Skip users not in this server
        }
        
        let displayName = "Unknown User";
        
        try {
            displayName = member.user.tag;
        } catch (error) {
            console.log(`Could not get user info for ${userId}:`, error.message);
            displayName = `User ${userId}`;
        }
        
        const formattedAmount = amount.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
        content += `${i + 1}. **${displayName}** => ${formattedAmount}\n`;
    }
  message.channel.send(`**${message.guild.name} Kopek Leaderboard (In Bank)**\n\n${content}`);
};

module.exports.help = {
    name: "leaderboard",
    aliases: ["top"]
};