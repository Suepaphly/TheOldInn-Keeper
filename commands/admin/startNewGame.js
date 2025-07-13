
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../../utility/protectTheTavern.js");

exports.run = async (client, message, args) => {
   const ownerID = [
    "367445249376649217"
   ];
   if (!ownerID.includes(message.author.id)) return;
   
   await ptt.setupNewGame();
   
   // Reset all Tiamat cooldowns for all users
   const { QuickDB } = require("quick.db");
   const db = new QuickDB();
   
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
