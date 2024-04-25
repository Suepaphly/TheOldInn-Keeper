const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (bot, message, args) => {
    let lvls = "";

    // Retrieve all data from the database
    const resp = Object.entries(db.all())
        .filter(([key, value]) => key.includes(`level_${message.author.id}`))
        .map(([key, value]) => ({ ID: key, data: value }));

    // Sort data from higher to lower
    resp.sort((a, b) => (a.data < b.data) ? 1 : -1);

    let content = "";

    if (resp.length === 0) {
        content += `**No Levels**`;
    }

    for (let i = 0; i < resp.length; i++) {
        let user = resp[i].ID.split('level_')[0];
        let lev = await db.get(`${user}level_${message.author.id}`);
        let levelType = user.charAt(0).toUpperCase() + user.slice(1);
        content += `${i + 1}. <@${message.author.id}> **${levelType} Level** => ${lev}\n`;
    }

    message.channel.send(content);
};

module.exports.help = {
    name: "checklvls",
    aliases: ["check", "lvls", "stat", "stats"]
};
