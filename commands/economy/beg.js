const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../../utility/protectTheTavern.js");
module.exports.run = async (client, message, args) => {

    let user = message.author;

    // Check if user is on a quest
    const { isOnQuest } = require('../quest.js');
    if (await isOnQuest(user.id)) {
        return message.channel.send("❌ You cannot beg while on a quest!");
    }

    // Check if town is under attack
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const stimmy = require("./stimmy.js");
    const activeStimulus = stimmy.getActiveStimulus();

    // Check if stimulus is active
    if (!activeStimulus || !activeStimulus.active) {
        const laughMessages = [
            "😂 Hahaha! You're begging with no stimulus active? How poor are you?",
            "🤣 LMAO! Imagine begging when there's no stimulus! Get a job!",
            "😆 The audacity! Begging with empty pockets and no stimulus!",
            "🤡 *Points and laughs* Look at this beggar with no stimulus!",
            "💸 No stimulus = no money for you, beggar!"
        ];
        const randomLaugh = laughMessages[Math.floor(Math.random() * laughMessages.length)];
        return message.channel.send(randomLaugh);
    }

    // Check if user already claimed
    if (activeStimulus.claimedUsers.includes(user.id)) {
        return message.channel.send("You already claimed your stimulus reward!");
    }

    // Check if slots available
    if (activeStimulus.remainingSlots <= 0) {
        return message.channel.send("Sorry! All stimulus slots have been claimed.");
    }

    // Give reward
    await db.add(`money_${user.id}`, activeStimulus.individualReward);

    // Update stimulus state
    activeStimulus.claimedUsers.push(user.id);
    activeStimulus.remainingSlots--;

    message.channel.send(`💰 **${user.username}** was given **${activeStimulus.individualReward} kopeks** from the stimulus! (${activeStimulus.remainingSlots} slots remaining)`);

    // Check if stimulus is fully claimed
    if (activeStimulus.remainingSlots <= 0) {
        activeStimulus.active = false;
        message.channel.send(`🎉 **STIMULUS COMPLETED!** All 10 slots have been claimed! Thanks to **${activeStimulus.donor}** for the generous donation!`);
    }

    // Update the stimulus state
    stimmy.updateStimulus(activeStimulus);
};

module.exports.help = {
    name: "beg",
    aliases: ["claim"]
};