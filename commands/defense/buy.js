const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    // Redirect to the new =protect command
    message.channel.send("⚠️ The `=buy` command has been replaced with `=protect`! Please use `=protect` instead for all town defense purchases.\n\nExample: `=protect` for the interactive menu, or `=protect 5 rampart town_guard` for direct purchases.");
}

module.exports.help = {
    name: "buy",
    aliases: ["b"]
}