require('dotenv').config(); // Load environment variables from .env file

const { Client, Events, GatewayIntentBits } = require('discord.js'); // Load environment variables from .env file
const axios = require('axios');
const { getTransactionDetails } = require('./commands/checktx');  // Make sure to update this path to where your checktx.js is located
const { EmbedBuilder } = require('discord.js');
const checkForNewTransaction = require('./commands/address_scan'); // Load Address Scan functions
const trackingIntervals = new Map(); // Global map to store tracking intervals

const addressMap = {};
// setInterval(() => checkForNewTransaction(client, addressMap), 5000);

const client = new Client({ intents: [GatewayIntentBits.Guilds] }); // Create a new client instance

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async c => {
    try {
        console.log(`Ready! Logged in as ${c.user.tag}`);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

// This event will run whenever a user types a slash command
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

	if (interaction.commandName === 'trackaddress') {
		const ethAddress = interaction.options.getString('address');
		const channelId = interaction.options.getString('channelid');
		
		// Store this information
		addressMap[ethAddress] = channelId;

		const intervalId = setInterval(() => checkForNewTransaction(client, addressMap), 1000);
        trackingIntervals.set(ethAddress, intervalId);
		
		await interaction.reply(`Now tracking address ${ethAddress} and will post updates in channel ${channelId}`);
	}

	if (interaction.commandName === 'stoptracking') {
		const address = interaction.options.getString('address');
	
		// Remove the address from the addressMap to stop tracking
		if (addressMap.hasOwnProperty(address)) {
			delete addressMap[address];
			await interaction.reply(`Stopped tracking address ${address}`);
		} else {
			await interaction.reply(`No tracking found for address ${address}`);
		}
	}

    if (interaction.commandName === 'checktx') {
		const ethAddress = interaction.options.getString('address');
		try {
			const transactions = await getTransactionDetails(ethAddress);
			
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('Last Transactions')
				.setDescription(`Ethereum Address: ${ethAddress}`);
			
			const fields = transactions.map((tx, index) => {
				return {
					name: `Transaction #${index + 1}`,
					value: `Date: ${tx.date}\n` +
						   `Method: ${tx.method}\n` +
						   `From: ${tx.from}\n` +
						   `To: ${tx.to}\n` +
						   `Value: ${tx.value} \n` +
						   `Txn Fee: ${tx.txnFee} `
				};
			});
	
			embed.addFields(fields);
	
			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error("Error details:", error);
			await interaction.reply('An error occurred while fetching transactions.');
		}
	}
});

client.login(process.env.BOT_TOKEN); // Login Discord with Token.
