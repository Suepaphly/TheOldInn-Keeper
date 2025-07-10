
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Global stimulus state
let activeStimulus = null;

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const user = message.author;
    const amount = parseInt(args[0]);
    const userMoney = await db.get(`money_${user.id}`) || 0;

    // Validate amount
    if (!amount || amount <= 0 || isNaN(amount)) {
        return message.channel.send("Please specify a valid amount of kopeks for the stimulus.");
    }

    if (amount > userMoney) {
        return message.channel.send("You don't have enough kopeks to fund this stimulus.");
    }

    // Check if stimulus is already active
    if (activeStimulus && activeStimulus.active) {
        return message.channel.send("A stimulus is already active! Wait for it to end before starting a new one.");
    }

    // Deduct money from user
    await db.sub(`money_${user.id}`, amount);

    // Calculate individual reward (10% of total, divided by 10 users)
    const individualReward = Math.floor(amount * 0.1);

    // Set up stimulus
    activeStimulus = {
        active: true,
        totalAmount: amount,
        individualReward: individualReward,
        remainingSlots: 10,
        claimedUsers: [],
        donor: user.username,
        channel: message.channel
    };

    message.channel.send(`💰 **STIMULUS ACTIVATED!** 💰\n**${user.username}** has donated **${amount} kopeks**!\nFirst **10** users to use \`=beg\` will receive **${individualReward} kopeks** each!\n⏰ Stimulus expires in 60 seconds!`);

    // Set up reminder intervals
    const reminderInterval = setInterval(() => {
        if (activeStimulus && activeStimulus.active) {
            message.channel.send(`💸 **STIMULUS REMINDER!** ${activeStimulus.remainingSlots} slots remaining! Use \`=beg\` to claim your **${activeStimulus.individualReward} kopeks**!`);
        } else {
            clearInterval(reminderInterval);
        }
    }, 15000); // Every 15 seconds

    // Set expiration timer
    setTimeout(() => {
        if (activeStimulus && activeStimulus.active) {
            activeStimulus.active = false;
            message.channel.send("⏰ **STIMULUS EXPIRED!** The stimulus period has ended.");
            clearInterval(reminderInterval);
        }
    }, 60000); // 60 seconds
};

module.exports.help = {
    name: "stimmy",
    aliases: ["stimulus"]
};

// Export stimulus state for beg command
module.exports.getActiveStimulus = () => activeStimulus;
module.exports.updateStimulus = (newState) => { activeStimulus = newState; };
