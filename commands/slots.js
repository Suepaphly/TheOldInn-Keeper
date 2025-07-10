const slotItems = ["🍇", "🍌", "🍉", "🍋", "🍒", ":peach:", ":pineapple:", ":apple:", ":blueberries:", ":moneybag:", ":coin:", ":gem:"];
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { EmbedBuilder } = require('discord.js');

module.exports.run = async (client, message, args) => {

    let user = message.author;
    let moneydb = await db.get(`money_${user.id}`)
    let money = Math.abs(parseInt(args[0]));
    let win = false;
    let bal = await db.get(`money_${user.id}`)

    if (!money) return message.channel.send(`Wrong usage, specify an amount of kopeks.`);
    if (money > moneydb) return message.channel.send(`Wrong usage, you are betting more than you have.`);

    let number = []
    for (i = 0; i < 3; i++) { number[i] = Math.floor(Math.random() * slotItems.length); }
      if (number[0] == number[1] && number[1] == number[2]) { 
          money *= 9
          win = true;
      } else if (number[0] == number[1] || number[0] == number[2] || number[1] == number[2] ) { 
          money *= 3
          win = true;
      }

    if (win) {
        let slotsEmbed1 = new EmbedBuilder()
            .setTitle(message.author.username + `'s :slot_machine: Slot Machine :slot_machine:` + '\n___')
            .setDescription(`${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]}\n\nYou won \`${money}\` kopeks.`)
            .setColor("#363940")
            .setFooter({ text: 'The Tavernkeeper thanks you for playing.' });
        message.channel.send({ embeds: [slotsEmbed1] })

        await db.add(`money_${user.id}`, money)
    } else {
        let slotsEmbed = new EmbedBuilder()
            .setTitle(message.author.username + `'s :slot_machine: Slot Machine :slot_machine:` + '\n___')
            .setDescription(`${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]}\n\nYou lost \`${money}\` kopeks.`)
            .setColor("#363940")
            .setFooter({ text: 'The Tavernkeeper thanks you for playing.' });

        message.channel.send({ embeds: [slotsEmbed] })
        await db.sub(`money_${user.id}`, money)
    }

}

  module.exports.help = {
    name:"slots",
    aliases: ["slots-machine", "slot", "slot-machine", "fruit-machine"]
  }