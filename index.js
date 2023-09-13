require('dotenv').config(); // Load environment variables from .env file

const { Client, Events, GatewayIntentBits } = require('discord.js'); // Load environment variables from .env file
const axios = require('axios');
const { getTransactionDetails } = require('./commands/checktx');  // Make sure to update this path to where your checktx.js is located
const { EmbedBuilder } = require('discord.js');
const checkForNewTransaction = require('./commands/address_scan'); // Load Address Scan functions
const trackingIntervals = new Map(); // Global map to store tracking intervals
const fs = require('fs');
const path = require('path');
const { ActivityType } = require('discord.js')


const addressMap = {};

const client = new Client({ intents: [GatewayIntentBits.Guilds] }); // Create a new client instance

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async c => {
    try {
        console.log(`Ready! Logged in as ${c.user.tag}`);
		client.user.setActivity(
			{
				name: 'STAYC',
				type: ActivityType.Streaming,
				url: 'https://www.twitch.tv/baronvonalexs',
				status: 'idle'
			}
		);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

// This event will run whenever a user types a slash command
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

	if (interaction.commandName === 'activetracking') {
		const trackedAddresses = Object.keys(addressMap);
		if (trackedAddresses.length === 0) {
			await interaction.reply('No addresses are currently being tracked.');
		} else {
			await interaction.reply(`Currently tracking the following addresses: ${trackedAddresses.join(', ')}`);
		}
	}
	
	if (interaction.commandName === 'trackaddress') {
		const ethAddress = interaction.options.getString('address');
		const channelId = interaction.options.getString('channelid');
		
		if (Object.keys(addressMap).length >= 1) {
			await interaction.reply('You can only track one address at a time.');
			return;
		}

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
            // Clear the interval if it exists
            if (trackingIntervals.has(address)) {
                clearInterval(trackingIntervals.get(address));
                trackingIntervals.delete(address);
            }

            // Delete last transaction hash file
            const fileName = path.join('TXHash', `lastTransactionHash_${address}.txt`);
            if (fs.existsSync(fileName)) {
                fs.unlinkSync(fileName);
            }

            delete addressMap[address];
            await interaction.reply(`Stopped tracking address ${address} and deleted the associated file.`);
        } else {
            await interaction.reply(`No tracking found for address ${address}`);
        }
    }

    if (interaction.commandName === 'checktx') {
		const ethAddress = interaction.options.getString('address');
		const userSelectedOffset = interaction.options.getInteger('amount'); // Replace 'num_transactions' with the actual command/option name
	
		try {
			const transactions = await getTransactionDetails(ethAddress, userSelectedOffset);
			
			const embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle('Last Transactions')
				.setDescription(`Ethereum Address: ${ethAddress}`);
			
			const fields = transactions.map((tx, index) => {
				return {
					name: `Transaction #${index + 1}`,
					value: `Date: ${tx.date}\n` +
						   `Token: ${tx.tokenName}\n` +
						   `From: ${tx.from}\n` +
						   `To: ${tx.to}\n` +
						   `Value: ${tx.value} Tokens\n` +
						   `Txn Fee: ${tx.txnFee} ETH`
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
