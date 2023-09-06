require('dotenv').config(); // Load environment variables from .env file

const { Client, Events, GatewayIntentBits } = require('discord.js'); // Load environment variables from .env file
const axios = require('axios');
const { getTransactionDetails } = require('./commands/checktx');  // Make sure to update this path to where your checktx.js is located
const { handleCheckTx } = require('./commands/checktx');  // Adjust the path as needed



const client = new Client({ intents: [GatewayIntentBits.Guilds] }); // Create a new client instance

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    const appId = '1148860480681672704'; // Replace this with your bot's Client ID

    // Registering commands
    try {
        // Registering the /checktx command
        await axios.post(
            `https://discord.com/api/v9/applications/${appId}/commands`,
            {
                name: 'checktx',
                description: 'Check transactions for a specific Ethereum address',
                options: [
                    {
                        name: 'address',
                        type: 3,  // For STRING type
                        description: 'The Ethereum address to check',
                        required: true
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bot ${process.env.BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Commands registered');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

// This event will run whenever a user types a slash command
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'checktx') {
        const ethAddress = interaction.options.getString('address');
        try {
            const transactions = await getTransactionDetails(ethAddress);
            let replyText = 'Last transaction:\n';

            transactions.forEach((tx, index) => {
                replyText += `#${index + 1} - Date: ${tx.date}, Method: ${tx.method}, From: ${tx.from}, To: ${tx.to}, Value: ${tx.value} ETH, Txn Fee: ${tx.txnFee} ETH\n`;
            });

            await interaction.reply(replyText);
        } catch (error) {
			console.error("Error details:", error);
			await interaction.reply('An error occurred while fetching transactions.');
		}
		
    }
});



// Log in to Discord with your client's token from .env file
client.login(process.env.BOT_TOKEN);
