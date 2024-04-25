const db = require("quick.db");
const { EmbedBuilder } = require("discord.js");
const ptt = require("../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    const user = message.author;
    const item = args[0];
    const amount = args[1];
    const location = args[2];
    const money = await db.fetch(`money_${message.author.id}`);

    if (item == null || amount == null) {
        const buyEmbed = new EmbedBuilder()
            .setColor('#000001')
            .setTitle("Buy Castle Walls, Army Troops, and Defensive Traps.")
            .setDescription(`Just type =buy [wall, army, or trap] [amount] [Traps and Army: Choose Rampart, Wall, or Castle].
                             \n You can leave the amount blank to see prices and current amounts.
                             \n Ex: =buy town_gaurd 5 rampart; =buy rampart 2; =buy boiling_oil 4 castle`)
            .setFooter({ text: 'The Tavernkeeper thanks you for playing. \n' });
        message.channel.send({ embeds: [buyEmbed] });
    } else {
        if (ptt.troopArray.includes(item) && ptt.wallArray.includes(location)) {
            ptt.buyArmy(item, amount, location, user, message);
        } else if (ptt.trapArray.includes(item) && ptt.wallArray.includes(location)) {
            ptt.buyTrap(item, amount, location, user, message);
        } else if (ptt.wallArray.includes(item)) {
            ptt.buyWall(item, amount, user, message);
        } else {
            message.channel.send("Make sure you set the location! Ex: =buy boiling_oil 1 castle");
        }
    }
}

module.exports.help = {
    name: "buy",
    aliases: ["b"]
}
