const { EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Import roulette game state (this will be shared)
const rouletteModule = require('./roulette.js');

function isValidBet(betType) {
    const validBets = [
        'red', 'black', 'green', 'even', 'odd', 'low', 'high', '1-18', '19-36',
        '1st12', '2nd12', '3rd12', 'first12', 'second12', 'third12',
        'col1', 'col2', 'col3', 'column1', 'column2', 'column3'
    ];

    if (validBets.includes(betType.toLowerCase())) return true;

    const num = parseInt(betType);
    return !isNaN(num) && num >= 0 && num <= 36;
}

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    // Initialize global state if it doesn't exist
    if (!global.rouletteGame) {
        global.rouletteGame = {
            active: false,
            bets: [],
            channel: null,
            timer: null,
            turnCount: 0,
            lastNumbers: []
        };
    }

    if (!global.rouletteGame.active) {
        return message.channel.send("🎰 No roulette game is currently active! Use `=startroulette` to start a new game.");
    }

    if (!global.rouletteGame.channel || global.rouletteGame.channel.id !== message.channel.id) {
        const activeChannel = global.rouletteGame.channel ? `<#${global.rouletteGame.channel.id}>` : "another channel";
        return message.channel.send(`🎰 The roulette game is running in ${activeChannel}! You can only bet in that channel.`);
    }

    const betType = args[0];
    const betAmount = parseInt(args[1]);

    if (!betType || !betAmount) {
        return message.channel.send("❌ **Invalid bet format!** Use: `=rbet [type] [amount]`\nExample: `=rbet red 100`\nUse `=rhelp` for all betting options.");
    }

    if (!isValidBet(betType)) {
        return message.channel.send("❌ **Invalid bet type!** Use `=rhelp` to see all available betting options.");
    }

    if (betAmount < 1) {
        return message.channel.send("❌ **Invalid bet amount!** You must bet at least 1 kopek.");
    }

    const userMoney = await db.get(`money_${message.author.id}`) || 0;

    if (userMoney < betAmount) {
        return message.channel.send(`❌ **Insufficient funds!** You have ${userMoney} kopeks but tried to bet ${betAmount} kopeks.`);
    }

    // Deduct money and add new bet (multiple bets allowed)
    await db.sub(`money_${message.author.id}`, betAmount);
    global.rouletteGame.bets.push({
        userId: message.author.id,
        username: message.author.username,
        type: betType.toLowerCase(),
        amount: betAmount
    });

    // Group bets by user for display
    const betsByUser = {};
    global.rouletteGame.bets.forEach(bet => {
        if (!betsByUser[bet.userId]) {
            betsByUser[bet.userId] = [];
        }
        betsByUser[bet.userId].push(`${bet.type} (${bet.amount})`);
    });

    const betDisplay = Object.entries(betsByUser)
        .map(([userId, bets]) => `<@${userId}>: ${bets.join(', ')} kopeks`)
        .join('\n');

    const betEmbed = new EmbedBuilder()
        .setTitle("🎰 BET PLACED!")
        .setColor("#4CAF50")
        .setDescription(`<@${message.author.id}> bet **${betAmount}** kopeks on **${betType}**!`)
        .addFields(
            { name: "Current Bets", value: betDisplay, inline: false }
        )
        .setFooter({ text: "You can place more bets! The wheel will spin when betting time ends." });

    await message.channel.send({ embeds: [betEmbed] });

    // Reset timing when a bet is placed (extends the betting period)
    if (global.rouletteGame.bets.length === 1) {
        global.rouletteGame.roundStartTime = Date.now();
    }
};

module.exports.help = {
    name: "rbet",
    aliases: ["roulettebet", "bet"]
};