const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    const user = message.author;
    const amount = args[0];
    const locationOrItem = args[1];
    const item = args[2];
    const money = await db.get(`money_${message.author.id}`);

    if (!amount || (!locationOrItem && !item)) {
        message.channel.send(`<@${user.id}>, Buy Castle Walls, Army Troops, and Defensive Traps.
                             Just type =buy [amount] [location] [item].
                             You can leave the amount blank to see prices and current amounts.
                             Ex: =buy 5 rampart town_guard; =buy 2 rampart; =buy 4 castle boiling_oil
                             The Tavernkeeper thanks you for playing.`);
    } else {
        if (item) {
            // The command includes an item and a location
            if (ptt.troopArray.includes(item) && ptt.wallArray.includes(locationOrItem)) {
                ptt.buyArmy(item, amount, locationOrItem, user, message);
            } else if (ptt.trapArray.includes(item) && ptt.wallArray.includes(locationOrItem)) {
                ptt.buyTrap(item, amount, locationOrItem, user, message);
            } else {
                message.channel.send(`<@${user.id}>, Make sure you set the location! Ex: =buy 1 castle boiling_oil`);
            }
        } else {
            // The command is for buying a wall, rampart, or castle
            const wallItem = locationOrItem;
            if (ptt.wallArray.includes(wallItem)) {
                ptt.buyWall(wallItem, amount, user, message);
            } else {
                message.channel.send(`<@${user.id}>, Make sure you set the location! Ex: =buy 1 castle boiling_oil`);
            }
        }
    }
}

module.exports.help = {
    name: "buy",
    aliases: ["b"]
}
