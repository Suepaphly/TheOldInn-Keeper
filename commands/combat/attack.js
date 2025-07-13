
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require('discord.js');
const ptt = require("../../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    const user = message.author;
    const member = message.guild.members.cache.get(user.id);
    const mentionedUser = message.mentions.users.first();

    // This command requires a user mention for PvP combat
    if (!mentionedUser) {
        if (ptt.lockArena) {
            return message.channel.send("❌ To defend the town during battles, use `=defend` instead! For PvP combat, mention a user: `=attack @user`");
        } else {
            return message.channel.send("❌ You must mention a user to attack! Usage: `=attack @user`");
        }
    }

    // Redirect to PvP attack functionality
    const pvpAttack = require('./attackplayer.js');
    return pvpAttack.run(client, message, args);

    
};

module.exports.help = {
    name: "attack",
    aliases: ["atk", "fight"]
};
