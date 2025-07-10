const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    let ms;
    try {
        ms = (await import("parse-ms")).default;
    } catch (error) {
        console.error("Failed to import parse-ms", error);
        return;
    }

    let user = message.author;
    let daily = await db.get(`daily_${user.id}`);
    let fish = await db.get(`fish_${user.id}`);
    let craft = await db.get(`craft_${user.id}`);
    let gather = await db.get(`gather_${user.id}`);
    let hunt = await db.get(`hunt_${user.id}`);
    let work = await db.get(`work_${user.id}`);
    let rob = await db.get(`rob_${user.id}`);
    let deposit = await db.get(`deposit_${user.id}`);

    let userarray = [daily, fish, craft, gather, hunt, work, rob, deposit];

    let dailytimeout = 46000000; //In Ms (about 12.77 hours)
    let fishtimeout = 1800000; //In Ms (30 minutes)
    let crafttimeout = 9000000; //In Ms (2.5 hours)
    let gathertimeout = 900000; //In Ms (15 minutes)
    let hunttimeout = 3600000; //In Ms (1 hour)
    let worktimeout = 18000000; //In Ms (5 hours)
    let robtimeout = 3600000; //In Ms (1 hour)
    let deposittimeout = 21600000; //In Ms (6 hours)

    let timeoutarray = [
        dailytimeout,
        fishtimeout,
        crafttimeout,
        gathertimeout,
        hunttimeout,
        worktimeout,
        robtimeout,
        deposittimeout,
    ];
    let namearray = [
        "Daily",
        "Fish",
        "Craft",
        "Gather",
        "Hunt",
        "Work",
        "Rob",
        "Deposit",
    ];

    let content = `${message.author}, here are your cooldowns:\n\n`;

    for (let i = 0; i < timeoutarray.length; i++) {
        if (
            userarray[i] !== null &&
            timeoutarray[i] - (Date.now() - userarray[i]) > 0
        ) {
            let time = ms(timeoutarray[i] - (Date.now() - userarray[i]));

            content += `${namearray[i]}: ${
                time.days ? time.days + "d, " : ""
            }${time.hours}h, ${time.minutes}m, ${time.seconds}s\n`;
        } else {
            content += `${namearray[i]}: Available Now\n`;
        }
    }

    content += "\n The Tavernkeeper thanks you for playing.";
    message.channel.send(content);
};

module.exports.help = {
    name: "cooldowns",
    aliases: ["cools", "cool", "cd", "timer", "timers"],
};
