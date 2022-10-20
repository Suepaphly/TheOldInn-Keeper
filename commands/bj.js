const db = require("quick.db");
const Discord = require("discord.js")

exports.run = async (bot, message, args) => {

    let user = message.author;
    let money = Math.abs(parseInt(args[0]));
    let moneydb = await db.fetch(`money_${message.author.id}`)    
      let a = message.author;


      if (args[0] === 'all' || args[0] === 'max') {
          money = moneydb;
      } else {
          money = parseInt(args[0]);
      }

      if (!money || money < 1 || money > moneydb) {
          message.channel.send("Enter a valid number of kopeks.")
          return
      }

      if (!moneydb) {
          message.channel.send("You do not have enough kopeks")
          return
      }

      // ** BEGIN Javascript blackjack game from echohatch1. Modified for Grape.

      var numCardsPulled = 0;
      var gameOver = false;    
    
      var player = {
          cards: [],
          score: 0,
          double: false
      };
      var dealer = {
          cards: [],
          score: 0
      };

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
        if (player.double === true) {
          money = money*2;
        }
        if (outcome === "win") {
          db.add(`money_${message.author.id}`, money);
        }
        if (outcome === "lose") {
          db.subtract(`money_${message.author.id}`, money);
        }

        if (outcome === "bj") {
          db.add(`money_${message.author.id}`, money*2);
        }
    }

      function resetGame() {
          numCardsPulled = 0;
          player.cards = [];
          dealer.cards = [];
          player.score = 0;
          dealer.score = 0;
          deck.initialize();
      }

      function endMsg(title, msg, dealerC) {
          let cardsMsg = "";
          player.cards.forEach(function(card) {
              cardsMsg += "[`" + card.rank.toString();
              if (card.suit == "Hearts") cardsMsg += "♥"
              if (card.suit == "Diamonds") cardsMsg += "♦"
              if (card.suit == "Spades") cardsMsg += "♠"
              if (card.suit == "Clubs") cardsMsg += "♣"
              cardsMsg += "`](https://example.com) "
          });
          cardsMsg += " --> " + player.score.toString()

          let dealerMsg = "";
          if (!dealerC) {
              dealerMsg = "[`" + dealer.cards[0].rank.toString();
              if (dealer.cards[0].suit == "Hearts") dealerMsg += "♥"
              if (dealer.cards[0].suit == "Diamonds") dealerMsg += "♦"
              if (dealer.cards[0].suit == "Spades") dealerMsg += "♠"
              if (dealer.cards[0].suit == "Clubs") dealerMsg += "♣"
              dealerMsg += " ? ?`](https://dashcord.tech/)"
          } else {
              dealerMsg = "";
              dealer.cards.forEach(function(card) {
                  dealerMsg += "[`" + card.rank.toString();
                  if (card.suit == "Hearts") dealerMsg += "♥"
                  if (card.suit == "Diamonds") dealerMsg += "♦"
                  if (card.suit == "Spades") dealerMsg += "♠"
                  if (card.suit == "Clubs") dealerMsg += "♣"
                  dealerMsg += "`](https://dashcord.tech/) "
              });
              dealerMsg += " --> " + dealer.score.toString()
          }

          const gambleEmbed = new Discord.MessageEmbed()
              .setColor('#000001')
              .setTitle(message.author.username + `'s Blackjack Table` + '\n___')
              .addField('Your Cards:', cardsMsg)
              .addField('Dealer\'s Cards', dealerMsg)
              .addField(title, msg)
              .setFooter('The Tavernkeeper thanks you for playing. \n');

          message.channel.send(gambleEmbed);
      }

      async function endGame() {
          if (player.score === 21) {
              bet('bj');
              gameOver = true;
              await endMsg("YOU WIN!", "You Got 21! That's a x3 bonus!", true)
          }
          if (player.score > 21) {
              bet('lose');
              gameOver = true;
              await endMsg("You Lose", "Over 21, you Bust.", true)
          }
          if (dealer.score === 21) {
              bet('lose');
              gameOver = true;
              await endMsg("You Lose.", "Dealer has 21.", true)
          }
          if (dealer.score > 21) {
              bet('win');
              gameOver = true;
              await endMsg("YOU WIN!", "Dealer Busts.", true)
          }
          if (dealer.score >= 17 && player.score > dealer.score && player.score < 21) {
              bet('win');
              gameOver = true;
              await endMsg("YOU WIN!", "You beat the Dealer!", true)
          }
          if (dealer.score >= 17 && player.score < dealer.score && dealer.score < 21) {
              bet('lose');
              gameOver = true;
              await endMsg("You Lose", "The Dealer beat you.", true)
          }
          if (dealer.score >= 17 && player.score === dealer.score && dealer.score < 21) {
              gameOver = true;
              await endMsg("Draw", "You and the dealer matched score.", true)
          }
      }

      function dealerDraw() {

          dealer.cards.push(deck.deckArray[numCardsPulled]);
          dealer.score = getCardsValue(dealer.cards);
          numCardsPulled += 1;
      }

      function newGame() {
          hit();
          hit();
          dealerDraw();
          endGame();
      }

      function hit(double = false) {
          player.cards.push(deck.deckArray[numCardsPulled]);
          player.score = getCardsValue(player.cards);

          numCardsPulled += 1;
          if (numCardsPulled > 2 && !double) {
              endGame();
          }
      }

      function stand() {
          while (dealer.score < 17 && player.score < 22) {
              dealerDraw();
          }
          endGame();
      }
      // END Javascript blackjack game from echohatch1. Modified for Grape. **

      newGame();
      async function loop() {
          if (gameOver) return;

          endMsg("BJ", '**Type \'h\' to HIT and \'s\' to STAY and stop the game, \n or \'d\' to DOUBLE DOWN and hit once with double your bet.** ', false)

          let filter = m => m.author.id === message.author.id;
          message.channel.awaitMessages(filter, {
              max: 1,
              time: 1200000,
              errors: ['time']
          }).then(message => {
              message = message.first()
              if (message.content === "h") {
                  hit();
                  loop();
                  return
              } else if (message.content === "s") {
                  stand();
                  loop();
                  return
              } else if (message.content === "d") {
                  player.double = true;
                  hit(true);
                  stand();
                  loop();
                  return
              } else {                  
                  loop();
                  return
              }
          }).catch(_ => {
              message.channel.send("**You've lost all your kopeks.**");
              bet("lose");
              return
          })
      }

      await loop()
  };

module.exports.help = {
  name:"bj",
  aliases: ["blackjack"]
}
