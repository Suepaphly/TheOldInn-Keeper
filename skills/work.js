const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const mg = require("../utility/utility.js");

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    let ms;
    try {
        ms = (await import("parse-ms")).default;
    } catch (error) {
        console.error("Failed to import parse-ms", error);
        return;
    }

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    let user = message.author;
    let author = await db.get(`work_${user.id}`)
 let userlevel = await db.get(`workinglevel_${user.id}`)

    let timeout = 18000000;

    if (author !== null && timeout - (Date.now() - author) > 0) {
        let time = ms(timeout - (Date.now() - author));


        message.channel.send(`**${member.user.tag}**, you already worked recently, try again in \`${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds\`.`)
      } else {



    let rarehunt = [
        "**:guard: (Royal Guard)**",
        "**:health_worker: (Doctor)**",
        "**:scientist: (Alchemist)**",
        "**:judge: (Judge)**",
        "**:people_wrestling: (Gladiator)**"
    ]

    let bighunt = [
        "**:firefighter: (Firefighter)**",
        "**:pilot: (Boat Captain)**",
        "**:police_officer: (Town Guard)**",
        "**:construction_worker: (Builder)**",
        "**:horse_racing: (Courier)**"
    ]

    let hunt = [
        "**:factory_worker: (Blacksmith)**",
        "**:mechanic: (Tinkerer)**",
        "**:artist: (Artist)**",
        "**:detective: (Investigator)**",
        "**:student: (Scholar)**"
    ]

    let trash = [
        "**:teacher: (Teacher)**",
        "**:farmer: (Farmer)**",
        "**:cook: (Cook)**",
        "**:person_in_tuxedo: (Servant)**",
        "**:person_juggling: (Jester)**"
    ]


   var fisharray = [trash, hunt, bighunt, rarehunt];
   var fishresult;

   if(userlevel != null){ 
      fishresult = mg.skillMinigame("work", userlevel);
   } else {
      fishresult = mg.skillMinigame("work", 0);
   }
        message.channel.send(`**WORK MINIGAME:** - :briefcase: \n**${member.user.tag}** has worked as a ${fisharray[fishresult[0]][fishresult[1]]} and earned \`${fishresult[2]}\` kopeks.`)

    db.add(`money_${user.id}`, fishresult[2])
    db.set(`work_${user.id}`, Date.now())

    };
    }


module.exports.help = {
  name:"work",
  aliases: []
}