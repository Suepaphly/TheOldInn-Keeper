const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const cron = require("node-cron");
const db = new QuickDB();

// Global roulette game state
if (!global.rouletteGame) {
    global.rouletteGame = {
        active: false,
        bets: [],
        channel: null,
        timer: null,
        cronJob: null,
        turnCount: 0,
        lastNumbers: [],
        roundStartTime: null,
    };
}

// Roulette wheel numbers with their colors
const rouletteWheel = {
    0: "green",
    1: "red",
    2: "black",
    3: "red",
    4: "black",
    5: "red",
    6: "black",
    7: "red",
    8: "black",
    9: "red",
    10: "black",
    11: "black",
    12: "red",
    13: "black",
    14: "red",
    15: "black",
    16: "red",
    17: "black",
    18: "red",
    19: "red",
    20: "black",
    21: "red",
    22: "black",
    23: "red",
    24: "black",
    25: "red",
    26: "black",
    27: "red",
    28: "black",
    29: "black",
    30: "red",
    31: "black",
    32: "red",
    33: "black",
    34: "red",
    35: "black",
    36: "red",
};

// Bet validation and payout calculation
function calculatePayout(betType, betValue, winningNumber) {
    const color = rouletteWheel[winningNumber];

    switch (betType.toLowerCase()) {
        case "red":
            return color === "red" && winningNumber !== 0 ? 2 : 0;
        case "black":
            return color === "black" && winningNumber !== 0 ? 2 : 0;
        case "green":
            return winningNumber === 0 ? 36 : 0;
        case "even":
            return winningNumber !== 0 && winningNumber % 2 === 0 ? 2 : 0;
        case "odd":
            return winningNumber !== 0 && winningNumber % 2 === 1 ? 2 : 0;
        case "low":
        case "1-18":
            return winningNumber >= 1 && winningNumber <= 18 ? 2 : 0;
        case "high":
        case "19-36":
            return winningNumber >= 19 && winningNumber <= 36 ? 2 : 0;
        case "1st12":
        case "first12":
            return winningNumber >= 1 && winningNumber <= 12 ? 3 : 0;
        case "2nd12":
        case "second12":
            return winningNumber >= 13 && winningNumber <= 24 ? 3 : 0;
        case "3rd12":
        case "third12":
            return winningNumber >= 25 && winningNumber <= 36 ? 3 : 0;
        case "col1":
        case "column1":
            return winningNumber !== 0 && (winningNumber - 1) % 3 === 0 ? 3 : 0;
        case "col2":
        case "column2":
            return winningNumber !== 0 && (winningNumber - 2) % 3 === 0 ? 3 : 0;
        case "col3":
        case "column3":
            return winningNumber !== 0 && winningNumber % 3 === 0 ? 3 : 0;
        default:
            // Single number bet
            const num = parseInt(betType);
            if (!isNaN(num) && num >= 0 && num <= 36) {
                return winningNumber === num ? 36 : 0;
            }
            return 0;
    }
}

function isValidBet(betType) {
    const validBets = [
        "red",
        "black",
        "green",
        "even",
        "odd",
        "low",
        "high",
        "1-18",
        "19-36",
        "1st12",
        "2nd12",
        "3rd12",
        "first12",
        "second12",
        "third12",
        "col1",
        "col2",
        "col3",
        "column1",
        "column2",
        "column3",
    ];

    if (validBets.includes(betType.toLowerCase())) return true;

    const num = parseInt(betType);
    return !isNaN(num) && num >= 0 && num <= 36;
}

async function startBettingRound() {
    global.rouletteGame.roundStartTime = Date.now();
    
    const embed = new EmbedBuilder()
        .setTitle("🎰 ROULETTE - PLACE YOUR BETS!")
        .setColor("#FF6B6B")
        .setDescription(
            "**Betting is now open!** Use `=rbet [type] [amount]` to place your bet.\n\n⏰ **15 seconds** to place bets...",
        )
        .addFields({
            name: "Current Bets",
            value:
                global.rouletteGame.bets.length === 0
                    ? "No bets placed yet"
                    : (() => {
                        const betsByUser = {};
                        global.rouletteGame.bets.forEach(bet => {
                            if (!betsByUser[bet.userId]) {
                                betsByUser[bet.userId] = [];
                            }
                            betsByUser[bet.userId].push(`${bet.type} (${bet.amount})`);
                        });
                        return Object.entries(betsByUser)
                            .map(([userId, bets]) => `<@${userId}>: ${bets.join(', ')} kopeks`)
                            .join('\n');
                    })(),
            inline: false,
        })
        .setFooter({ text: "Game continues until 2 turns pass with no bets!" });

    await global.rouletteGame.channel.send({ embeds: [embed] });

    // Start a cron job that runs every second to check timing
    global.rouletteGame.cronJob = cron.schedule('* * * * * *', async () => {
        if (!global.rouletteGame.active || !global.rouletteGame.roundStartTime) {
            return;
        }

        const elapsed = Date.now() - global.rouletteGame.roundStartTime;
        
        if (elapsed >= 15000) { // 15 seconds have passed
            global.rouletteGame.cronJob.stop();
            global.rouletteGame.cronJob.destroy();
            global.rouletteGame.cronJob = null;
            
            if (global.rouletteGame.bets.length === 0) {
                global.rouletteGame.turnCount++;
                if (global.rouletteGame.turnCount >= 2) {
                    await endGame("No bets were placed. Roulette game ended.");
                } else {
                    await lastCallForBets();
                }
            } else {
                await spinWheel();
            }
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });
}

async function lastCallForBets() {
    global.rouletteGame.roundStartTime = Date.now();
    
    const embed = new EmbedBuilder()
        .setTitle("🎰 ROULETTE - LAST CALL!")
        .setColor("#FFA500")
        .setDescription(
            "**Last call for bets!** This is your final chance.\n\n⏰ **15 seconds** remaining...",
        )
        .setFooter({ text: "Place your bets now or the game ends!" });

    await global.rouletteGame.channel.send({ embeds: [embed] });

    global.rouletteGame.cronJob = cron.schedule('* * * * * *', async () => {
        if (!global.rouletteGame.active || !global.rouletteGame.roundStartTime) {
            return;
        }

        const elapsed = Date.now() - global.rouletteGame.roundStartTime;
        
        if (elapsed >= 15000) { // 15 seconds have passed
            global.rouletteGame.cronJob.stop();
            global.rouletteGame.cronJob.destroy();
            global.rouletteGame.cronJob = null;
            
            if (global.rouletteGame.bets.length === 0) {
                await endGame("No bets were placed. Roulette game ended.");
            } else {
                await spinWheel();
            }
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });
}

async function spinWheel() {
    const noMoreBetsEmbed = new EmbedBuilder()
        .setTitle("🚫 NO MORE BETS!")
        .setColor("#FF0000")
        .setDescription("**Betting is closed!** The wheel is spinning...")
        .setFooter({ text: "Good luck to all players!" });

    await global.rouletteGame.channel.send({ embeds: [noMoreBetsEmbed] });

    // Simulate wheel spinning delay with cron
    global.rouletteGame.roundStartTime = Date.now();
    global.rouletteGame.cronJob = cron.schedule('* * * * * *', async () => {
        if (!global.rouletteGame.active || !global.rouletteGame.roundStartTime) {
            return;
        }

        const elapsed = Date.now() - global.rouletteGame.roundStartTime;
        
        if (elapsed >= 3000) { // 3 seconds spinning delay
            global.rouletteGame.cronJob.stop();
            global.rouletteGame.cronJob.destroy();
            global.rouletteGame.cronJob = null;
        const winningNumber = Math.floor(Math.random() * 37); // 0-36
        const color = rouletteWheel[winningNumber];

        // Add to last numbers history
        global.rouletteGame.lastNumbers.unshift(winningNumber);
        if (global.rouletteGame.lastNumbers.length > 10) {
            global.rouletteGame.lastNumbers =
                global.rouletteGame.lastNumbers.slice(0, 10);
        }

        // Calculate winnings
        let results = [];
        let totalWinnings = 0;

        for (const bet of global.rouletteGame.bets) {
            const multiplier = calculatePayout(
                bet.type,
                bet.amount,
                winningNumber,
            );
            const winnings = bet.amount * multiplier;

            if (multiplier > 0) {
                await db.add(`money_${bet.userId}`, winnings);
                results.push(
                    `✅ <@${bet.userId}>: Won ${winnings} kopeks (${bet.type})`,
                );
                totalWinnings += winnings;
            } else {
                results.push(
                    `❌ <@${bet.userId}>: Lost ${bet.amount} kopeks (${bet.type})`,
                );
            }
        }

        const colorEmoji =
            color === "red" ? "🔴" : color === "black" ? "⚫" : "🟢";

        const resultEmbed = new EmbedBuilder()
            .setTitle("🎰 ROULETTE RESULTS!")
            .setColor(
                color === "red"
                    ? "#FF0000"
                    : color === "black"
                      ? "#000000"
                      : "#00FF00",
            )
            .setDescription(
                `**The ball landed on:** ${colorEmoji} **${winningNumber}** (${color})`,
            )
            .addFields(
                {
                    name: "Results",
                    value:
                        results.length > 0
                            ? results.join("\n")
                            : "No bets were placed",
                    inline: false,
                },
                {
                    name: "Total Winnings",
                    value: `${totalWinnings} kopeks`,
                    inline: true,
                },
                {
                    name: "Total Bets",
                    value: `${global.rouletteGame.bets.length}`,
                    inline: true,
                },
            )
            .setFooter({
                text: "Thank you for playing! Use =startroulette to play again.",
            });

        await global.rouletteGame.channel.send({ embeds: [resultEmbed] });
        
        // Reset for next round
        global.rouletteGame.bets = [];
        global.rouletteGame.turnCount = 0;
        
        // Wait 3 seconds then start next betting round
        setTimeout(() => {
            if (global.rouletteGame.active) {
                startBettingRound();
            }
        }, 3000);
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });
}

async function endGame(message = null) {
    if (global.rouletteGame.timer) {
        clearTimeout(global.rouletteGame.timer);
    }
    
    if (global.rouletteGame.cronJob) {
        global.rouletteGame.cronJob.stop();
        global.rouletteGame.cronJob.destroy();
    }

    const channel = global.rouletteGame.channel;

    global.rouletteGame.active = false;
    global.rouletteGame.bets = [];
    global.rouletteGame.channel = null;
    global.rouletteGame.timer = null;
    global.rouletteGame.cronJob = null;
    global.rouletteGame.turnCount = 0;
    global.rouletteGame.roundStartTime = null;

    if (message && channel) {
        const endEmbed = new EmbedBuilder()
            .setTitle("🎰 ROULETTE ENDED")
            .setColor("#808080")
            .setDescription(message)
            .setFooter({ text: "Use =startroulette to start a new game!" });

        await channel.send({ embeds: [endEmbed] });
    }
}

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send(
            "⚔️ The town is under attack! All civilian activities are suspended until the battle ends.",
        );
    }

    const command = args[0]?.toLowerCase();

    if (!command || command === "start") {
        // Initialize global state if it doesn't exist
        if (!global.rouletteGame) {
            global.rouletteGame = {
                active: false,
                bets: [],
                channel: null,
                timer: null,
                cronJob: null,
                turnCount: 0,
                lastNumbers: [],
                roundStartTime: null,
            };
        }

        // Start roulette game - check if already active
        if (global.rouletteGame.active) {
            const activeChannel = global.rouletteGame.channel
                ? `<#${global.rouletteGame.channel.id}>`
                : "another channel";
            return message.channel.send(
                `🎰 A roulette game is already in progress in ${activeChannel}! Wait for it to finish or place your bets with \`=rbet\`.`,
            );
        }

        global.rouletteGame.active = true;
        global.rouletteGame.channel = message.channel;
        global.rouletteGame.bets = [];
        global.rouletteGame.turnCount = 0;

        const startEmbed = new EmbedBuilder()
            .setTitle("🎰 ROULETTE GAME STARTED!")
            .setColor("#4CAF50")
            .setDescription(
                "**Welcome to the Roulette Table!**\n\nThe dealer is preparing the wheel...",
            )
            .addFields(
                {
                    name: "How to Play",
                    value: "Use `=rbet [type] [amount]` to place your bet\nExample: `=rbet red 100`",
                    inline: false,
                },
                {
                    name: "Available Bets",
                    value: "Use `=rhelp` for a full list of betting options",
                    inline: false,
                },
            )
            .setFooter({ text: "Betting will open in 3 seconds..." });

        await message.channel.send({ embeds: [startEmbed] });

        // Start betting after a short delay
        setTimeout(() => {
            if (global.rouletteGame.active) {
                startBettingRound();
            }
        }, 3000);
    }
};

module.exports.help = {
    name: "startroulette",
    aliases: ["roulette", "rstart"],
};
