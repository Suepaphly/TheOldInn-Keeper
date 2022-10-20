const Discord = require("discord.js");
const db = require("quick.db");

module.exports.run = async (client, message, args) => {

  message.channel.send(`
=wallet - Check your balance
=top - see the top wallets

=daily - receive your daily 100 kopeks
=gather - gather a random plant and sell it for kopeks
=hunt - hunt a random animal and sell it for kopeks
=fish - fish a random thing and sell it for kopeks
=craft - craft a random item and sell it for kopeks
=work - work a random job and make kopeks

=cooldowns - check all your cooldown timers
=checklvl - check your levels

=bank [deposit amount] - Check your bank balance and deposit kopeks. Safe from Robbers. 
=withdraw [withdraw amount] - Withdraw kopeks from your bank. Will withdraw all if left blank
=lvl [skill] - Level up skills
=buy [defenses] - Buy defenses for the town

=rob [user] - attempt to rob a user for up to 20%, (20% fail chance)
=bj [bet amount] - play blackjack
=craps [bet amount] - play craps
=slots [bet amount] - play slots
=pay [user] [amount] - pay another user kopeks`);
          
}; 


module.exports.help = {
  name:"help",
  aliases: ["commands", "command"]
}
