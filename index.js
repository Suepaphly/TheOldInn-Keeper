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

// Load command files from all directories
const commandDirs = ['./commands/', './commands/economy/', './commands/gambling/', './commands/skills/', './commands/defense/', './commands/combat/', './commands/admin/'];

commandDirs.forEach(dir => {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.log(`Directory ${dir} not found or error reading:`, err);
      return;
    }

    let jsfile = files.filter(f => f.split(".").pop() === "js");

    jsfile.forEach((f, i) => {
      let props = require(`${dir}${f}`);
      console.log(`${f} loaded from ${dir}!`);
      client.commands.set(props.help.name, props);
      props.help.aliases.forEach(alias => {
        client.aliases.set(alias, props.help.name);
      });
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

  // Initialize the random monster attack scheduler
  // Look for "the_castle" channel specifically
  const ptt = require("./utility/protectTheTavern.js");
  const castleChannel = client.channels.cache.find(channel => 
    channel.name === 'the_castle' && channel.type === 0
  );

  if (castleChannel) {
    ptt.initializeScheduler(client, castleChannel);
    console.log("Random monster attack scheduler initialized for #the_castle");
  } else {
    console.log("Channel #the_castle not found - scheduled attacks disabled");
  }
});

const db = require('quick.db');

client.on("messageCreate", async message => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;

    // Track last seen for garbage collection
    await db.set(`last_seen_${message.author.id}`, Date.now());

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

const ptt = require("./utility/protectTheTavern.js");
const { startCooldownCleanup } = require("./utility/cooldownCleanup.js");

client.on("ready", () => {
    console.log(`The Ol' Innkeeper is ready for action!`);
    ptt.initializeScheduler(client, client.channels.cache.get('881226993253179392'));
    startCooldownCleanup(client);
});

client.on("interactionCreate", async (interaction) => {
    // Handle button interactions for protection system
    if (interaction.isButton() && interaction.customId.startsWith('protect_') || 
        interaction.customId.startsWith('buy_') || 
        interaction.customId.startsWith('location_') || 
        interaction.customId.startsWith('trap_location_') ||
        interaction.customId === 'back_to_main') {

        const { handleProtectionButton } = require("./utility/protectionButtons.js");
        try {
            await handleProtectionButton(interaction);
        } catch (error) {
            console.error("Error handling protection button:", error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: "❌ There was an error processing your request!", 
                    ephemeral: true 
                });
            }
        }
        return;
    }

    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: "There was an error while executing this command!", 
            ephemeral: true 
        });
    }
});

client.login(token);