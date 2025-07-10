
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

    // Check if user already has a bet
    const existingBetIndex = global.rouletteGame.bets.findIndex(bet => bet.userId === message.author.id);
    
    if (existingBetIndex !== -1) {
        // Update existing bet
        const oldBet = global.rouletteGame.bets[existingBetIndex];
        await db.add(`money_${message.author.id}`, oldBet.amount); // Refund old bet
        await db.sub(`money_${message.author.id}`, betAmount); // Deduct new bet
        
        global.rouletteGame.bets[existingBetIndex] = {
            userId: message.author.id,
            username: message.author.username,
            type: betType.toLowerCase(),
            amount: betAmount
        };

        const updateEmbed = new EmbedBuilder()
            .setTitle("🎰 BET UPDATED!")
            .setColor("#FFA500")
            .setDescription(`<@${message.author.id}> updated their bet to **${betType}** for **${betAmount}** kopeks!`)
            .setFooter({ text: "Previous bet was refunded automatically." });

        await message.channel.send({ embeds: [updateEmbed] });
    } else {
        // Place new bet
        await db.sub(`money_${message.author.id}`, betAmount);
        
        global.rouletteGame.bets.push({
            userId: message.author.id,
            username: message.author.username,
            type: betType.toLowerCase(),
            amount: betAmount
        });

        const betEmbed = new EmbedBuilder()
            .setTitle("🎰 BET PLACED!")
            .setColor("#4CAF50")
            .setDescription(`<@${message.author.id}> bet **${betAmount}** kopeks on **${betType}**!`)
            .addFields(
                { name: "Current Bets", value: global.rouletteGame.bets.map(bet => `<@${bet.userId}>: ${bet.type} - ${bet.amount} kopeks`).join('\n'), inline: false }
            )
            .setFooter({ text: "Good luck! The wheel will spin when betting time ends." });

        await message.channel.send({ embeds: [betEmbed] });
    }

    // Reset timer if this is the first bet of the round
    if (global.rouletteGame.bets.length === 1 && global.rouletteGame.timer) {
        clearTimeout(global.rouletteGame.timer);
        // The timer will be reset in the main roulette module
    }
};

module.exports.help = {
    name: "rbet",
    aliases: ["roulettebet", "bet"]
};
