
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../utility/protectTheTavern.js");

exports.run = async (client, message, args) => {
   const ownerID = [
    "367445249376649217"
   ];
   if (!ownerID.includes(message.author.id)) return;
   await ptt.setupNewGame();
   message.channel.send("🏰 New game has been set up! Town defenses reset.");
};

module.exports.help = {
  name:"startNewGame",
  aliases: ["startnewgame"]
}
