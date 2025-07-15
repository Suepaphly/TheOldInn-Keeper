const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../../utility/protectTheTavern.js");
const config = require("../../config.json"); // Import the config

exports.run = async (client, message, args) => {
   if (message.author.id !== config.ownerID) return;

   await ptt.setupNewGame();

   // Reset all Tiamat cooldowns for all users

   try {
       // Get all keys that match the tiamat cooldown pattern
       const allKeys = await db.all();
       const tiamatKeys = allKeys.filter(item => item.id.startsWith('tiamat_cooldown_'));

       // Delete all Tiamat cooldowns
       for (const item of tiamatKeys) {
           await db.delete(item.id);
       }

       message.channel.send("🏰 New game has been set up! Town defenses reset and all Tiamat cooldowns cleared.");
   } catch (error) {
       console.error('Error resetting Tiamat cooldowns:', error);
       message.channel.send("🏰 New game has been set up! Town defenses reset. (Note: There was an issue clearing Tiamat cooldowns)");
   }
};

module.exports.help = {
  name:"startNewGame",
  aliases: ["startnewgame"]
}