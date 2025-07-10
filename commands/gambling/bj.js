
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ptt = require("../../utility/protectTheTavern.js");

// Store active games per user
const activeGames = new Map();

exports.run = async (client, message, args) => {
    // Check if town is under attack
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const userId = message.author.id;
    
    // Check if user already has an active game
    if (activeGames.has(userId)) {
        return message.channel.send(`❌ <@${message.author.id}>, you already have an active blackjack game! Finish it before starting a new one.`);
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

    // Create game instance for this user
    const gameInstance = createGameInstance(message.author.id, money);
    activeGames.set(userId, gameInstance);

    function getCardsValue(a) {
        var cardArray = [],
            sum = 0,
            i = 0,
            dk = 10.5,
            doubleking = "QQ",
            aceCount = 0;
        cardArray = a;
        for (i; i < cardArray.length; i += 1) {
            if (cardArray[i].rank === "J" || cardArray[i].rank === "Q" || cardArray[i].rank === "K") {
                sum += 10;
            } else if (cardArray[i].rank === "A") {
                sum += 11;
                aceCount += 1;
            } else if (cardArray[i].rank === doubleking) {
                sum += dk
            } else {
                sum += cardArray[i].rank;
            }
        }
        while (aceCount > 0 && sum > 21) {
            sum -= 10;
            aceCount -= 1;
        }
        return sum;
    }

    var deck = {
        deckArray: [],
        initialize: function() {
            var suitArray, rankArray, s, r, n;
            suitArray = ["Clubs", "Diamonds", "Hearts", "Spades"];
            rankArray = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
            n = 13;
            for (s = 0; s < suitArray.length; s += 1) {
                for (r = 0; r < rankArray.length; r += 1) {
                    this.deckArray[s * n + r] = {
                        rank: rankArray[r],
                        suit: suitArray[s]
                    };
                }
            }
        },
        shuffle: function() {
            var temp, i, rnd;
            for (i = 0; i < this.deckArray.length; i += 1) {
                rnd = Math.floor(Math.random() * this.deckArray.length);
                temp = this.deckArray[i];
                this.deckArray[i] = this.deckArray[rnd];
                this.deckArray[rnd] = temp;
            }
        }
    };

    deck.initialize();
    deck.shuffle();

    async function bet(outcome) {        
        if (gameInstance.player.double === true) {
            money = money * 2;
        }
        if (outcome === "win") {
            await db.add(`money_${message.author.id}`, money);
        }
        if (outcome === "lose") {
            await db.sub(`money_${message.author.id}`, money);
        }
        if (outcome === "bj") {
            await db.add(`money_${message.author.id}`, money * 2);
        }
    }

    function resetGame() {
        gameInstance.numCardsPulled = 0;
        gameInstance.player.cards = [];
        gameInstance.dealer.cards = [];
        gameInstance.player.score = 0;
        gameInstance.dealer.score = 0;
        deck.initialize();
    }

    function endMsg(title, msg, dealerC, showButtons = false) {
        let cardsMsg = "";
        gameInstance.player.cards.forEach(function(card) {
            cardsMsg += "[`" + card.rank.toString();
            if (card.suit == "Hearts") cardsMsg += "♥"
            if (card.suit == "Diamonds") cardsMsg += "♦"
            if (card.suit == "Spades") cardsMsg += "♠"
            if (card.suit == "Clubs") cardsMsg += "♣"
            cardsMsg += "`](https://example.com) "
        });
        cardsMsg += " --> " + gameInstance.player.score.toString()

        let dealerMsg = "";
        if (!dealerC) {
            dealerMsg = "[`" + gameInstance.dealer.cards[0].rank.toString();
            if (gameInstance.dealer.cards[0].suit == "Hearts") dealerMsg += "♥"
            if (gameInstance.dealer.cards[0].suit == "Diamonds") dealerMsg += "♦"
            if (gameInstance.dealer.cards[0].suit == "Spades") dealerMsg += "♠"
            if (gameInstance.dealer.cards[0].suit == "Clubs") dealerMsg += "♣"
            dealerMsg += " ? ?`](https://dashcord.tech/)"
        } else {
            dealerMsg = "";
            gameInstance.dealer.cards.forEach(function(card) {
                dealerMsg += "[`" + card.rank.toString();
                if (card.suit == "Hearts") dealerMsg += "♥"
                if (card.suit == "Diamonds") dealerMsg += "♦"
                if (card.suit == "Spades") dealerMsg += "♠"
                if (card.suit == "Clubs") dealerMsg += "♣"
                dealerMsg += "`](https://dashcord.tech/) "
            });
            dealerMsg += " --> " + gameInstance.dealer.score.toString()
        }

        const gambleEmbed = new EmbedBuilder()
            .setColor('#000001')
            .setTitle(message.author.username + `'s Blackjack Table` + '\n___')
            .addFields(
                { name: 'Your Cards:', value: cardsMsg, inline: false },
                { name: 'Dealer\'s Cards', value: dealerMsg, inline: false },
                { name: title, value: msg, inline: false }
            )
            .setFooter({ text: 'The Tavernkeeper thanks you for playing.' });

        if (showButtons && !gameInstance.gameOver) {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('hit')
                        .setLabel('Hit')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stand')
                        .setLabel('Stand')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('double')
                        .setLabel('Double Down')
                        .setStyle(ButtonStyle.Success)
                );

            return { embeds: [gambleEmbed], components: [row] };
        } else {
            return { embeds: [gambleEmbed] };
        }
    }

    async function endGame() {
        if (gameInstance.player.score === 21) {
            bet('bj');
            gameInstance.gameOver = true;
            activeGames.delete(userId);
            return await endMsg("YOU WIN!", "You Got 21! That's a x3 bonus!", true)
        }
        if (gameInstance.player.score > 21) {
            bet('lose');
            gameInstance.gameOver = true;
            activeGames.delete(userId);
            return await endMsg("You Lose", "Over 21, you Bust.", true)
        }
        if (gameInstance.dealer.score === 21) {
            bet('lose');
            gameInstance.gameOver = true;
            activeGames.delete(userId);
            return await endMsg("You Lose.", "Dealer has 21.", true)
        }
        if (gameInstance.dealer.score > 21) {
            bet('win');
            gameInstance.gameOver = true;
            activeGames.delete(userId);
            return await endMsg("YOU WIN!", "Dealer Busts.", true)
        }
        if (gameInstance.dealer.score >= 17 && gameInstance.player.score > gameInstance.dealer.score && gameInstance.player.score < 21) {
            bet('win');
            gameInstance.gameOver = true;
            activeGames.delete(userId);
            return await endMsg("YOU WIN!", "You beat the Dealer!", true)
        }
        if (gameInstance.dealer.score >= 17 && gameInstance.player.score < gameInstance.dealer.score && gameInstance.dealer.score < 21) {
            bet('lose');
            gameInstance.gameOver = true;
            activeGames.delete(userId);
            return await endMsg("You Lose", "The Dealer beat you.", true)
        }
        if (gameInstance.dealer.score >= 17 && gameInstance.player.score === gameInstance.dealer.score && gameInstance.dealer.score < 21) {
            gameInstance.gameOver = true;
            activeGames.delete(userId);
            return await endMsg("Draw", "You and the dealer matched score.", true)
        }
        return null;
    }

    function dealerDraw() {
        gameInstance.dealer.cards.push(deck.deckArray[gameInstance.numCardsPulled]);
        gameInstance.dealer.score = getCardsValue(gameInstance.dealer.cards);
        gameInstance.numCardsPulled += 1;
    }

    function newGame() {
        hit();
        hit();
        dealerDraw();
        return endGame();
    }

    function hit(double = false) {
        gameInstance.player.cards.push(deck.deckArray[gameInstance.numCardsPulled]);
        gameInstance.player.score = getCardsValue(gameInstance.player.cards);

        gameInstance.numCardsPulled += 1;
        if (gameInstance.numCardsPulled > 2 && !double) {
            return endGame();
        }
        return null;
    }

    function stand() {
        while (gameInstance.dealer.score < 17 && gameInstance.player.score < 22) {
            dealerDraw();
        }
        return endGame();
    }

    let gameResult = await newGame();
    if (gameResult) {
        message.channel.send(gameResult);
        return;
    }

    // Game continues - show buttons for player actions
    const gameMessage = await message.channel.send(
        endMsg("BJ", '**Choose your action:**', false, true)
    );

    const filter = (interaction) => {
        return interaction.user.id === message.author.id;
    };

    const collector = gameMessage.createMessageComponentCollector({
        filter,
        time: 120000 // 2 minutes
    });

    collector.on('collect', async (interaction) => {
        if (gameInstance.gameOver) {
            await interaction.reply({ content: `<@${interaction.user.id}>, game is already over!`, ephemeral: true });
            return;
        }

        let result = null;

        if (interaction.customId === 'hit') {
            result = await hit();
        } else if (interaction.customId === 'stand') {
            result = await stand();
        } else if (interaction.customId === 'double') {
            gameInstance.player.double = true;
            await hit(true);
            result = await stand();
        }

        if (result) {
            // Game ended - remove buttons
            const finalResult = { ...result, components: [] };
            await interaction.update(finalResult);
            collector.stop();
        } else if (!gameInstance.gameOver) {
            // Continue game
            await interaction.update(endMsg("BJ", '**Choose your action:**', false, true));
        }
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time' && !gameInstance.gameOver) {
            await bet("lose");
            activeGames.delete(userId);
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Game Timeout')
                .setDescription(`**${message.author.username}**, you took too long to respond. You've lost your bet of ${money} kopeks.`)
                .setFooter({ text: 'The Tavernkeeper thanks you for playing.' });

            await gameMessage.edit({ embeds: [timeoutEmbed], components: [] });
        }
    });
};

function createGameInstance(userId, betAmount) {
    return {
        userId: userId,
        betAmount: betAmount,
        numCardsPulled: 0,
        gameOver: false,
        player: {
            cards: [],
            score: 0,
            double: false
        },
        dealer: {
            cards: [],
            score: 0
        }
    };
}

module.exports.help = {
    name: "bj",
    aliases: ["blackjack"]
}
