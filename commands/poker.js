
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

// Store active games per user
const activePokerGames = new Map();

// Card suits and ranks
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const rankValues = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

// Poker hand rankings and payouts (Aces Wild)
const handRankings = {
    'Royal Flush': { rank: 10, payout: 50 },
    'Five of a Kind': { rank: 9, payout: 25 },
    'Straight Flush': { rank: 8, payout: 12 },
    'Four of a Kind': { rank: 7, payout: 7 },
    'Full House': { rank: 6, payout: 5 },
    'Flush': { rank: 5, payout: 3 },
    'Straight': { rank: 4, payout: 2 },
    'Three of a Kind': { rank: 3, payout: 1.5 },
    'Two Pair': { rank: 2, payout: 1.5 },
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
    const aceCount = cards.filter(card => card.rank === 'A').length;
    const nonAces = cards.filter(card => card.rank !== 'A');
    
    // Generate all possible hands by replacing aces with other cards
    const allPossibleHands = generateAceWildCombinations(cards, aceCount);
    
    let bestHand = 'High Card';
    let bestRank = 0;
    
    for (const hand of allPossibleHands) {
        const result = evaluateNaturalHand(hand);
        if (handRankings[result].rank > bestRank) {
            bestRank = handRankings[result].rank;
            bestHand = result;
        }
    }
    
    return bestHand;
}

function generateAceWildCombinations(cards, aceCount) {
    if (aceCount === 0) {
        return [cards];
    }
    
    const nonAces = cards.filter(card => card.rank !== 'A');
    const combinations = [];
    
    // For simplicity, try common substitutions
    const possibleRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const possibleSuits = ['♠', '♥', '♦', '♣'];
    
    function tryBestCombination() {
        // Create a hand with aces substituted optimally
        const testHand = [...nonAces];
        
        // Add substituted aces
        for (let i = 0; i < aceCount; i++) {
            // Try to make the best possible hand
            let bestCard = { rank: '2', suit: '♠', value: 2 };
            
            // Simple heuristic: if we need cards for straight/flush
            if (testHand.length > 0) {
                const suits = testHand.map(c => c.suit);
                const mostCommonSuit = suits.sort((a,b) =>
                    suits.filter(v => v===a).length - suits.filter(v => v===b).length
                ).pop();
                
                bestCard.suit = mostCommonSuit;
                
                // Try to complete straights or pairs
                const values = testHand.map(c => c.value).sort((a,b) => a-b);
                if (values.length > 0) {
                    bestCard.value = values[values.length - 1];
                    bestCard.rank = Object.keys(rankValues).find(k => rankValues[k] === bestCard.value) || 'K';
                }
            }
            
            testHand.push(bestCard);
        }
        
        return testHand;
    }
    
    // For wild cards, we'll evaluate the best possible hand
    return [tryBestCombination()];
}

function evaluateNaturalHand(cards) {
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
    const isStraight = isSequential(values);
    
    // Check for five of a kind (only possible with wild cards)
    if (counts[0] === 5) {
        return 'Five of a Kind';
    }
    
    // Check for royal flush (10, J, Q, K, A of same suit)
    if (isFlush && isStraight && values[0] === 10 && values[4] === 14) {
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
    
    // Check for jacks or better (pair of J, Q, K, or A)
    if (counts[0] === 2) {
        const pairRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 2);
        if (['J', 'Q', 'K', 'A'].includes(pairRank)) {
            return 'Jacks or Better';
        }
    }
    
    return 'High Card';
}

function isSequential(values) {
    const sorted = [...values].sort((a, b) => a - b);
    
    // Check normal sequence
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] !== sorted[i-1] + 1) {
            // Check for A-2-3-4-5 straight (wheel)
            if (sorted.join(',') === '2,3,4,5,14') {
                return true;
            }
            return false;
        }
    }
    return true;
}

function formatCard(card) {
    return `[${card.rank}${card.suit}]`;
}

function createGameEmbed(game, title, description, showButtons = false) {
    const handString = game.hand.map((card, index) => {
        const cardText = formatCard(card);
        return game.held[index] ? `**${cardText}**` : cardText;
    }).join(' ');
    
    const embed = new EmbedBuilder()
        .setTitle(`🃏 ${game.username}'s Poker Game`)
        .setColor('#4CAF50')
        .addFields(
            { name: 'Your Hand', value: handString || 'Drawing cards...', inline: false },
            { name: title, value: description, inline: false },
            { name: 'Bet Amount', value: `${game.betAmount} kopeks`, inline: true }
        );
    
    // Show original hand if we're in round 2 (after draw)
    if (game.round === 2 && game.originalHand) {
        const originalHandString = game.originalHand.map((card, index) => {
            const cardText = formatCard(card);
            return game.held[index] ? `**${cardText}**` : cardText;
        }).join(' ');
        embed.addFields(
            { name: 'Original Hand', value: originalHandString, inline: false }
        );
    }
    
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
        return { embeds: [embed], components: createHoldButtons(game) };
    } else if (showButtons && game.round === 2) {
        return { embeds: [embed], components: [createDrawButton()] };
    }
    
    return { embeds: [embed] };
}

function createHoldButtons(game) {
    const row1 = new ActionRowBuilder();
    const row2 = new ActionRowBuilder();
    
    for (let i = 0; i < 5; i++) {
        const isHeld = game.held[i];
        row1.addComponents(
            new ButtonBuilder()
                .setCustomId(`hold_${i}`)
                .setLabel(`Card ${i + 1}${isHeld ? ' (Held)' : ''}`)
                .setStyle(isHeld ? ButtonStyle.Success : ButtonStyle.Secondary)
        );
    }
    
    row2.addComponents(
        new ButtonBuilder()
            .setCustomId('done_selecting')
            .setLabel('Done - Draw New Cards')
            .setStyle(ButtonStyle.Primary)
    );
    
    return [row1, row2];
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

    // Show poker info if no arguments provided
    if (!args[0]) {
        const rewardsEmbed = new EmbedBuilder()
            .setTitle('🃏 Aces Wild Poker - Hand Rankings & Payouts')
            .setColor('#4CAF50')
            .setDescription('**Usage:** `=poker <bet amount>`\n\n🃑 **ACES ARE WILD!** Aces can substitute for any card to make the best possible hand.\n\nSelect cards to hold, then draw new ones!')
            .addFields(
                { name: 'Royal Flush', value: '50x your bet', inline: true },
                { name: 'Five of a Kind', value: '25x your bet', inline: true },
                { name: 'Straight Flush', value: '12x your bet', inline: true },
                { name: 'Four of a Kind', value: '7x your bet', inline: true },
                { name: 'Full House', value: '5x your bet', inline: true },
                { name: 'Flush', value: '3x your bet', inline: true },
                { name: 'Straight', value: '2x your bet', inline: true },
                { name: 'Three of a Kind', value: '1.5x your bet', inline: true },
                { name: 'Two Pair', value: '1.5x your bet', inline: true },
                { name: 'Jacks or Better', value: '1x your bet (J,Q,K,A pairs only)', inline: false }
            )
            .setFooter({ text: 'Hold cards by clicking the buttons, bold cards are held!' });
        
        return message.channel.send({ embeds: [rewardsEmbed] });
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
        originalHand: null,
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
        } else if (interaction.customId === 'done_selecting') {
            // Store original hand before drawing
            game.originalHand = [...game.hand];
            
            // Replace non-held cards (if user didn't hold all 5)
            let cardsReplaced = 0;
            for (let i = 0; i < 5; i++) {
                if (!game.held[i]) {
                    game.hand[i] = game.deck.pop();
                    cardsReplaced++;
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
            
            const resultDescription = cardsReplaced === 0 ? 
                `🔒 You held all 5 cards! ${payout > 0 ? `🎉 You won ${payout} kopeks with ${handRank}!` : `💸 No winning hand. Better luck next time!`}` :
                `🔄 Drew ${cardsReplaced} new card${cardsReplaced === 1 ? '' : 's'}! ${payout > 0 ? `🎉 You won ${payout} kopeks with ${handRank}!` : `💸 No winning hand. Better luck next time!`}`;
            
            await interaction.update(
                createGameEmbed(game, "Final Result", resultDescription, false)
            );
            
            activePokerGames.delete(userId);
            collector.stop();
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
