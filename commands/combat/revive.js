const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const user = message.author;
    const targetUser = message.mentions.members.first() || message.member;

    if (!targetUser) {
        return message.channel.send("❌ Could not find target user to revive!");
    }

    // Check if user has enough money
    const money = await db.get(`money_${user.id}`) || 0;
    let cost = 1000;
    let usingGreenCrystal = false;

    // Check for Healer feat (50% cost reduction, rounded up)
    const hasHealerFeat = await db.get(`feat_healer_${user.id}`) || 0;
    if (hasHealerFeat) {
        cost = Math.ceil(cost * 0.5); // 50% reduction, rounded up
    }

    // Check for green crystal free revive
    const { hasCrystal } = require("../../utility/crystalUtils.js");
    const hasGreenCrystal = await hasCrystal(user.id, 'green');

    if (hasGreenCrystal) {
        // Check if they've used the free revive in the last 24 hours
        const lastFreeRevive = await db.get(`green_crystal_revive_${user.id}`) || 0;
        const now = Date.now();
        const timeSince = now - lastFreeRevive;
        const hoursLeft = Math.ceil((86400000 - timeSince) / 3600000); // 24 hours in ms

        if (timeSince >= 86400000) { // 24 hours
            cost = 0;
            usingGreenCrystal = true;
        }
    }

    if (money < cost) {
        let errorMsg = `❌ You need ${cost.toLocaleString()} kopeks to revive! You have ${money.toLocaleString()}.`;

        if (hasGreenCrystal && !usingGreenCrystal) {
            const lastFreeRevive = await db.get(`green_crystal_revive_${user.id}`) || 0;
            const now = Date.now();
            const timeSince = now - lastFreeRevive;
            const hoursLeft = Math.ceil((86400000 - timeSince) / 3600000);
            errorMsg += ` 🟢 Green Crystal free revive available in ${hoursLeft} hours.`;
        }

        return message.channel.send(errorMsg);
    }

    // Check if target user is actually dead
    const deathTimer = await db.get(`death_cooldown_${targetUser.id}`);

    if (!deathTimer) {
        return message.channel.send(`❌ ${targetUser.user.username} is not currently dead and doesn't need to be revived.`);
    }

    // Check if death timer is still active (24 hours = 86400000 ms)
    const timeRemaining = 86400000 - (Date.now() - deathTimer);

    if (timeRemaining <= 0) {
        // Timer already expired, clean up the database
        await db.delete(`death_cooldown_${targetUser.id}`);
        return message.channel.send(`❌ ${targetUser.user.username} has already recovered naturally and doesn't need to be revived.`);
    }

    // Perform the revival
    if (usingGreenCrystal) {
        await db.set(`green_crystal_revive_${user.id}`, Date.now());
        await db.delete(`death_cooldown_${targetUser.id}`);
        
        if (targetUser.id === user.id) {
            message.channel.send(
                `✅ You revived yourself with your Green Crystal for free! Welcome back to the land of the living! 🟢`,
            );
        } else {
            message.channel.send(
                `✅ ${targetUser.user.username} was revived with your Green Crystal for free! Welcome back to the land of the living! 🟢`,
            );
        }
    } else {
        await db.sub(`money_${user.id}`, cost);
        await db.delete(`death_cooldown_${targetUser.id}`);
        
        let reviveMessage;
        if (targetUser.id === user.id) {
            reviveMessage = `✨ ${user.username} spent ${cost.toLocaleString()} kopeks to revive themselves! You can now participate in combat again.`;
        } else {
            reviveMessage = `✨ ${user.username} spent ${cost.toLocaleString()} kopeks to revive ${targetUser.user.username}! They can now participate in combat again.`;
        }
        
        if (hasHealerFeat) {
            reviveMessage += ` 🩺 **Healer feat** reduced the cost by 50%!`;
        }
        
        message.channel.send(reviveMessage);
    }
};

module.exports.help = {
    name: "revive",
    aliases: ["resurrect", "heal"]
};