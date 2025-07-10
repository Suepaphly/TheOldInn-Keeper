
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const mg = require("../utility/utility.js");
const constants = require("../config/constants.js");
const logger = require("../utility/logger.js");
const Validator = require("../utility/validation.js");
const ErrorHandler = require("../utility/errorHandler.js");

module.exports.run = async (client, message, args) => {
    // Input validation
    const validation = Validator.validateCommand(message, args, 0);
    if (!validation.isValid) {
        await ErrorHandler.handleValidationError(validation.errors, message, 'craft');
        return;
    }

    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        await message.channel.send(constants.ERRORS.TOWN_UNDER_ATTACK);
        return;
    }

    let ms;
    try {
        ms = (await import("parse-ms")).default;
    } catch (error) {
        logger.error("Failed to import parse-ms", error, message.author.id, 'craft');
        await message.channel.send("❌ A system error occurred. Please try again later.");
        return;
    }

    const user = message.author;
    let author, userlevel;

    try {
        author = await db.get(`craft_${user.id}`);
        userlevel = await db.get(`craftinglevel_${user.id}`);
    } catch (error) {
        await ErrorHandler.handleDatabaseError(error, user.id, 'fetch craft data');
        return;
    }

    const timeout = constants.COOLDOWNS.CRAFT;

    if (author !== null && Date.now() - author < timeout) {
        const time = ms(timeout - (Date.now() - author));
        await message.channel.send(
            `<@${user.id}>, you already crafted recently, try again in \`${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds\`.`
        );
        return;
    }

    // Craft items arrays
    const rarefish = [
        ":violin: (Violin)",
        ":guitar: (Guitar)",
        ":telescope: (Telescope)",
        ":house: (House)",
        ":sailboat: (Sailboat)",
    ];

    const bigfish = [
        ":crossed_swords: (Swords)",
        ":shield: (Shield)",
        ":hut: (Hut)",
        ":trumpet: (Trumpet)",
        ":canoe: (Canoe)",
    ];

    const fish = [
        ":axe: (Axe)",
        ":tent: (Tent)",
        ":dagger: (Dagger)",
        ":boomerang: (Boomerang)",
        ":teapot: (Teapot)",
    ];

    const trash = [
        ":hammer: (Hammer)",
        ":wrench: (Wrench)",
        ":screwdriver: (Screwdriver)",
        ":pick: (Pickaxe)",
        ":closed_lock_with_key: (Lock and Key)",
    ];

    const fisharray = [trash, fish, bigfish, rarefish];
    let fishresult;

    try {
        if (userlevel !== null) {
            fishresult = mg.skillMinigame("craft", userlevel);
        } else {
            fishresult = mg.skillMinigame("craft", 0);
        }

        // Enhanced validation of minigame result
        if (!fishresult || !Array.isArray(fishresult) || fishresult.length < 3) {
            throw new Error("Invalid minigame result");
        }

        const [categoryIndex, itemIndex, reward] = fishresult;

        if (categoryIndex < 0 || categoryIndex >= fisharray.length ||
            itemIndex < 0 || itemIndex >= fisharray[categoryIndex].length ||
            !Validator.isValidAmount(reward, 0, constants.ECONOMY.MAX_BET)) {
            throw new Error("Invalid minigame result values");
        }

        const craftedItem = fisharray[categoryIndex][itemIndex];
        
        await message.channel.send(
            `**CRAFTING MINIGAME:** - :tools:\n<@${user.id}>, you crafted a ${craftedItem} and earned \`${reward}\` kopeks.`
        );

        // Update database with error handling
        try {
            await db.add(`money_${user.id}`, reward);
            await db.set(`craft_${user.id}`, Date.now());
            
            logger.economy('craft', user.id, reward, true);
        } catch (error) {
            await ErrorHandler.handleDatabaseError(error, user.id, 'update craft rewards');
            return;
        }

    } catch (error) {
        logger.error("Crafting minigame failed", error, user.id, 'craft');
        await message.channel.send(
            `**CRAFTING MINIGAME:** - :tools:\n<@${user.id}>, something went wrong with your crafting attempt! Please try again.`
        );
    }
};

module.exports.help = {
    name: "craft",
    aliases: [],
};
