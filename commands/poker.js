
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

// Store active games per user
const activePokerGames = new Map();

// Card suits and ranks
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const rankValues = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

// Poker hand rankings and payouts
const handRankings = {
    'Royal Flush': { rank: 9, payout: 250 },
    'Straight Flush': { rank: 8, payout: 50 },
    'Four of a Kind': { rank: 7, payout: 25 },
    'Full House': { rank: 6, payout: 9 },
    'Flush': { rank: 5, payout: 6 },
    'Straight': { rank: 4, payout: 4 },
    'Three of a Kind': { rank: 3, payout: 3 },
    'Two Pair': { rank: 2, payout: 2 },
    'Jacks or Better': { rank: 1, payout: 1 },
    'High Card': { rank: 0, payout: 0 }
};

function createDeck() {
    const deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ suit, rank, value: rankValues[rank] });
        }
    }
    return shuffleDeck(deck);
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function evaluateHand(cards) {
    const sortedCards = [...cards].sort((a, b) => a.value - b.value);
    const suits = cards.map(card => card.suit);
    const ranks = cards.map(card => card.rank);
    const values = sortedCards.map(card => card.value);
    
    // Count occurrences of each rank
    const rankCounts = {};
    ranks.forEach(rank => {
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });
    
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const isFlush = suits.every(suit => suit === suits[0]);
    const isStraight = values.every((val, i) => i === 0 || val === values[i-1] + 1) ||
                      (values.join('') === '2,3,4,5,14'); // A-2-3-4-5 straight
    
    // Check for royal flush
    if (isFlush && isStraight && values[0] === 10) {
        return 'Royal Flush';
    }
    
    // Check for straight flush
    if (isFlush && isStraight) {
        return 'Straight Flush';
    }
    
    // Check for four of a kind
    if (counts[0] === 4) {
        return 'Four of a Kind';
    }
    
    // Check for full house
    if (counts[0] === 3 && counts[1] === 2) {
        return 'Full House';
    }
    
    // Check for flush
    if (isFlush) {
        return 'Flush';
    }
    
    // Check for straight
    if (isStraight) {
        return 'Straight';
    }
    
    // Check for three of a kind
    if (counts[0] === 3) {
        return 'Three of a Kind';
    }
    
    // Check for two pair
    if (counts[0] === 2 && counts[1] === 2) {
        return 'Two Pair';
    }
    
    // Check for jacks or better
    if (counts[0] === 2) {
        const pairRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 2);
        if (['J', 'Q', 'K', 'A'].includes(pairRank)) {
            return 'Jacks or Better';
        }
    }
    
    return 'High Card';
}

function formatCard(card) {
    return `[${card.rank}${card.suit}]`;
}

function createGameEmbed(game, title, description, showButtons = false) {
    const handString = game.hand.map((card, index) => {
        const held = game.held[index] ? '🔒' : '';
        return `${formatCard(card)} ${held}`;
    }).join(' ');
    
    const embed = new EmbedBuilder()
        .setTitle(`🃏 ${game.username}'s Poker Game`)
        .setColor('#4CAF50')
        .addFields(
            { name: 'Your Hand', value: handString || 'Drawing cards...', inline: false },
            { name: title, value: description, inline: false },
            { name: 'Bet Amount', value: `${game.betAmount} kopeks`, inline: true }
        );
    
    if (game.round === 2 && !showButtons) {
        const handRank = evaluateHand(game.hand);
        const payout = handRankings[handRank].payout * game.betAmount;
        embed.addFields(
            { name: 'Hand Result', value: handRank, inline: true },
            { name: 'Payout', value: `${payout} kopeks`, inline: true }
        );
    }
    
    embed.setFooter({ text: 'The Tavernkeeper thanks you for playing.' });
    
    if (showButtons && game.round === 1) {
        return { embeds: [embed], components: [createHoldButtons(game)] };
    } else if (showButtons && game.round === 2) {
        return { embeds: [embed], components: [createDrawButton()] };
    }
    
    return { embeds: [embed] };
}

function createHoldButtons(game) {
    const row = new ActionRowBuilder();
    
    for (let i = 0; i < 5; i++) {
        const isHeld = game.held[i];
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`hold_${i}`)
                .setLabel(`Card ${i + 1} ${isHeld ? '🔒' : ''}`)
                .setStyle(isHeld ? ButtonStyle.Success : ButtonStyle.Secondary)
        );
    }
    
    return row;
}

function createDrawButton() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('draw')
                .setLabel('Draw New Cards')
                .setStyle(ButtonStyle.Primary)
        );
}

exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const userId = message.author.id;
    
    // Check if user already has an active game
    if (activePokerGames.has(userId)) {
        return message.channel.send(`❌ <@${message.author.id}>, you already have an active poker game! Finish it before starting a new one.`);
    }

    let money = Math.abs(parseInt(args[0]));
    let moneydb = await db.get(`money_${message.author.id}`);

    if (args[0] === 'all' || args[0] === 'max') {
        money = moneydb;
    } else {
        money = parseInt(args[0]);
    }

    if (!money || money < 1 || money > moneydb) {
        return message.channel.send(`<@${message.author.id}>, enter a valid number of kopeks.`);
    }

    if (!moneydb) {
        return message.channel.send(`<@${message.author.id}>, you do not have enough kopeks.`);
    }

    // Deduct bet amount
    await db.sub(`money_${message.author.id}`, money);

    // Create new game
    const game = {
        userId: userId,
        username: message.author.username,
        betAmount: money,
        deck: createDeck(),
        hand: [],
        held: [false, false, false, false, false],
        round: 1,
        gameOver: false
    };

    // Deal initial 5 cards
    for (let i = 0; i < 5; i++) {
        game.hand.push(game.deck.pop());
    }

    activePokerGames.set(userId, game);

    // Show initial hand with hold buttons
    const gameMessage = await message.channel.send(
        createGameEmbed(game, "First Draw", "Select cards to hold, then draw new cards!", true)
    );

    const filter = (interaction) => {
        return interaction.user.id === message.author.id;
    };

    const collector = gameMessage.createMessageComponentCollector({
        filter,
        time: 120000 // 2 minutes
    });

    collector.on('collect', async (interaction) => {
        if (game.gameOver) {
            await interaction.reply({ content: `<@${interaction.user.id}>, game is already over!`, ephemeral: true });
            return;
        }

        if (interaction.customId.startsWith('hold_')) {
            const cardIndex = parseInt(interaction.customId.split('_')[1]);
            game.held[cardIndex] = !game.held[cardIndex];
            
            await interaction.update(
                createGameEmbed(game, "First Draw", "Select cards to hold, then draw new cards!", true)
            );
        } else if (interaction.customId === 'draw') {
            // Replace non-held cards
            for (let i = 0; i < 5; i++) {
                if (!game.held[i]) {
                    game.hand[i] = game.deck.pop();
                }
            }
            
            game.round = 2;
            game.gameOver = true;
            
            // Evaluate final hand
            const handRank = evaluateHand(game.hand);
            const payout = handRankings[handRank].payout * game.betAmount;
            
            if (payout > 0) {
                await db.add(`money_${game.userId}`, payout);
            }
            
            const resultDescription = payout > 0 ? 
                `🎉 You won ${payout} kopeks with ${handRank}!` : 
                `💸 No winning hand. Better luck next time!`;
            
            await interaction.update(
                createGameEmbed(game, "Final Result", resultDescription, false)
            );
            
            activePokerGames.delete(userId);
            collector.stop();
        }
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time' && !game.gameOver) {
            activePokerGames.delete(userId);
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Game Timeout')
                .setDescription(`**${message.author.username}**, you took too long to respond. Your bet of ${money} kopeks was forfeited.`)
                .setFooter({ text: 'The Tavernkeeper thanks you for playing.' });

            await gameMessage.edit({ embeds: [timeoutEmbed], components: [] });
        }
    });
};

module.exports.help = {
    name: "poker",
    aliases: ["5card", "stud"]
};
