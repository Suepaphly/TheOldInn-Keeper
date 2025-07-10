
const { EmbedBuilder } = require("discord.js");

module.exports.run = async (client, message, args) => {
    const embed = new EmbedBuilder()
        .setTitle("🎰 ROULETTE HELP")
        .setColor("#FFD700")
        .setDescription("**Complete guide to playing roulette in the tavern!**")
        .addFields(
            {
                name: "🎮 Commands",
                value: "`=startroulette` - Start a new roulette game\n`=rbet [type] [amount]` - Place a bet\n`=rlast` - Show last 10 numbers\n`=rhelp` - Show this help menu",
                inline: false
            },
            {
                name: "🎯 Basic Bets (2:1 payout)",
                value: "`red` - Red numbers\n`black` - Black numbers\n`even` - Even numbers (2,4,6...)\n`odd` - Odd numbers (1,3,5...)\n`low` or `1-18` - Numbers 1-18\n`high` or `19-36` - Numbers 19-36",
                inline: true
            },
            {
                name: "🎲 Column/Dozen Bets (3:1 payout)",
                value: "`1st12` or `first12` - Numbers 1-12\n`2nd12` or `second12` - Numbers 13-24\n`3rd12` or `third12` - Numbers 25-36\n`col1` or `column1` - Column 1\n`col2` or `column2` - Column 2\n`col3` or `column3` - Column 3",
                inline: true
            },
            {
                name: "💎 Special Bets",
                value: "`green` - Zero (0) - 36:1 payout\n`0-36` - Any single number - 36:1 payout",
                inline: false
            },
            {
                name: "📝 Betting Examples",
                value: "`=rbet red 100` - Bet 100 kopeks on red\n`=rbet 17 50` - Bet 50 kopeks on number 17\n`=rbet first12 200` - Bet 200 kopeks on 1-12",
                inline: false
            },
            {
                name: "⚡ Game Rules",
                value: "• Games start with `=startroulette`\n• 15 seconds to place bets per round\n• One bet per player (updates allowed)\n• Automatic payout after wheel spin\n• No bets = game ends after 2 rounds",
                inline: false
            }
        )
        .setFooter({ text: "Good luck at the tables! 🍀" });

    await message.channel.send({ embeds: [embed] });
};

module.exports.help = {
    name: "rhelp",
    aliases: ["roulettehelp", "rhelp"]
};
