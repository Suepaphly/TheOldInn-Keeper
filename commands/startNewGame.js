const Discord = require("discord.js");
const db = require("quick.db");
const ptt = require("../utility/protectTheTavern.js");

exports.run = async (client, message, args) => {
   const ownerID = [
    "367445249376649217"
  ];
  if (!ownerID.includes(message.author.id)) return;
  ptt.setupNewGame();
};

module.exports.help = {
  name:"startNewGame",
  aliases: ["startnewgame"]
}
