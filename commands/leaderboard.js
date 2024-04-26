const Discord = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (bot, message, args) => {
    // Fetch all entries
    const allEntries = await db.all();

    // Filter entries that start with "bank_" and map them into [key, value] format
    const bankEntries = allEntries
        .filter(entry => entry.id.startsWith("bank_"))
        .map(entry => [entry.id, entry.value]);

    // Sort the bank entries by value in descending order
    bankEntries.sort((a, b) => b[1] - a[1]);

    let content = "";
    const maxEntries = Math.min(bankEntries.length, 5);

    for (let i = 0; i < maxEntries; i++) {
        const [key, amount] = bankEntries[i];
        const userId = key.split('_')[1];
        const user = bot.users.cache.get(userId);
        if (user) {
            const formattedAmount = amount.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
            content += `${i + 1}. **${user.tag}** => ${formattedAmount}\n`;
        }
    }
  message.channel.send(`**${message.guild.name} Kopek Leaderboard (In Bank)**\n\n${content}`);
};

module.exports.help = {
    name: "leaderboard",
    aliases: ["top"]
};
