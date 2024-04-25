const db = require("quick.db");
const Discord = require("discord.js");

module.exports.run = async (client, message, args) => {
  let ms;
  try {
    ms = (await import("parse-ms")).default;
  } catch (error) {
    console.error("Failed to import parse-ms", error);
    return;
  }

  let user = message.author;
  let daily = await db.fetch(`daily_${user.id}`);
  let fish = await db.fetch(`fish_${user.id}`);
  let craft = await db.fetch(`craft_${user.id}`);
  let gather = await db.fetch(`gather_${user.id}`);
  let hunt = await db.fetch(`hunt_${user.id}`);
  let work = await db.fetch(`work_${user.id}`);
  let rob = await db.fetch(`rob_${user.id}`);
  let deposit = await db.fetch(`deposit_${user.id}`);

  let userarray = [daily, fish, craft, gather, hunt, work, rob, deposit];

  let dailytimeout = 46000000; //In Ms
  let fishtimeout = 1800000;
  let crafttimeout = 9000000;
  let gathertimeout = 900000;
  let hunttimeout = 3600000;
  let worktimeout = 18000000;
  let robtimeout = 36000000;
  let deposittimeout = 21600000;

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

  var cooldownEmbed = new Discord.MessageEmbed()
    .setColor("#000001")
    .setTitle(message.author.username + "'s :timer: Cooldowns.");

  for (let i = 0; i < timeoutarray.length; i++) {
    if (
      userarray[i] !== null &&
      timeoutarray[i] - (Date.now() - userarray[i]) > 9000
    ) {
      let time = ms(timeoutarray[i] - (Date.now() - userarray[i]));

      cooldownEmbed.addField(
        namearray[i],
        ` => ${time.hours}h, ${time.minutes}m, ${time.seconds}s.`,
      );
    } else {
      cooldownEmbed.addField(namearray[i], `=> Available Now`);
    }
  }

  cooldownEmbed.setFooter("The Tavernkeeper thanks you for playing.");
  message.channel.send(cooldownEmbed);
};

module.exports.help = {
  name: "cooldowns",
  aliases: ["timer", "timers"],
};
