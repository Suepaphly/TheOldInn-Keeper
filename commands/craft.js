const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const mg = require("../utility/utility.js");

module.exports.run = async (client, message, args) => {
    let ms;
    try {
        ms = (await import("parse-ms")).default;
    } catch (error) {
        console.error("Failed to import parse-ms", error);
        return;
    }

    const member =
        message.mentions.members.first() ||
        message.guild.members.cache.get(args[0]) ||
        message.member;
    const user = message.author;
    const author = await db.get(`craft_${user.id}`);
    const userlevel = await db.get(`craftinglevel_${user.id}`);

    const timeout = 9000000; // 2.5 hours

    if (author !== null && Date.now() - author < timeout) {
        const time = ms(timeout - (Date.now() - author));

        message.channel.send(
            `**${member.user.tag}**, you already crafted recently. Try again in ${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds.`
        );
    } else {
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

        if (userlevel !== null) {
            fishresult = mg.skillMinigame("craft", userlevel);
        } else {
            fishresult = mg.skillMinigame("craft", 0);
        }

        if (!args[0]) {
            message.channel.send(
                `**CRAFTING MINIGAME:** - :tools:\n${member}, you crafted a ${
                    fisharray[fishresult[0]][fishresult[1]]
                } and earned \`${fishresult[2]}\` kopeks.`
            );
            db.add(`money_${user.id}`, fishresult[2]);
            db.set(`craft_${user.id}`, Date.now());
        }
    }
};

module.exports.help = {
    name: "craft",
    aliases: [],
};
