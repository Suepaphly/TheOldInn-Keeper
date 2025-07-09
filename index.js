const config = require("./config.json");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");

// Create a new client instance with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  disableEveryone: true
});

const prefix = config.prefix;
const token = process.env.DISCORD_TOKEN;

client.commands = new Collection();
client.aliases = new Collection();

// Load command files
fs.readdir("./commands/", (err, files) => {
  if (err) console.log(err);
  let jsfile = files.filter(f => f.split(".").pop() === "js");
  if (jsfile.length <= 0) {
    console.log("Couldn't find commands.");
    return;
  }

  jsfile.forEach((f, i) => {
    let props = require(`./commands/${f}`);
    console.log(`${f} loaded!`);
    client.commands.set(props.help.name, props);
    props.help.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.on("ready", async () => {
  console.log(`${client.user.username} is ready for action!`);
  if (config.activity.streaming == true) {
    client.user.setActivity(config.activity.game, { url: 'https://twitch.tv/username' });
  } else {
    client.user.setActivity(config.activity.game, { type: 'WATCHING' }); // PLAYING, LISTENING, WATCHING
    client.user.setStatus('dnd'); // dnd, idle, online, invisible
  }
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;
  if (!message.content.startsWith(prefix)) return;

  let args = message.content.slice(prefix.length).trim().split(/ +/g);
  let cmd = args.shift().toLowerCase();

  let commandfile;
  if (client.commands.has(cmd)) {
    commandfile = client.commands.get(cmd);
  } else if (client.aliases.has(cmd)) {
    commandfile = client.commands.get(client.aliases.get(cmd));
  }

  if (!commandfile) return;

  try {
    commandfile.run(client, message, args);
  } catch (e) {
    console.error(e);
  }
});

client.login(token);
