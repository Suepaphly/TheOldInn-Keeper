
const { EmbedBuilder } = require("discord.js");

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

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

    const lastNumbers = global.rouletteGame.lastNumbers || [];

    if (lastNumbers.length === 0) {
        return message.channel.send("🎰 No roulette games have been played yet! Use `=startroulette` to start the first game.");
    }

    // Roulette wheel colors
    const rouletteWheel = {
        0: 'green',
        1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red', 10: 'black',
        11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red', 19: 'red', 20: 'black',
        21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
        31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
    };

    const formattedNumbers = lastNumbers.map(num => {
        const color = rouletteWheel[num];
        const emoji = color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢';
        return `${emoji} **${num}**`;
    }).join('  ');

    const embed = new EmbedBuilder()
        .setTitle("🎰 LAST ROULETTE NUMBERS")
        .setColor("#FFD700")
        .setDescription(`**Recent results** (most recent first):\n\n${formattedNumbers}`)
        .addFields(
            { name: "Legend", value: "🔴 Red • ⚫ Black • 🟢 Green (0)", inline: false },
            { name: "Games Played", value: `${lastNumbers.length}/10`, inline: true }
        )
        .setFooter({ text: "Use =startroulette to play again!" });

    await message.channel.send({ embeds: [embed] });
};

module.exports.help = {
    name: "rlast",
    aliases: ["roulettelast", "lastnum", "rhistory"]
};
