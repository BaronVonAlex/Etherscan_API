require('dotenv').config(); // Load environment variables from .env file
const { Client, Events, GatewayIntentBits } = require('discord.js'); // Load environment variables from .env file
const { getTransactionDetails } = require('./commands/checktx');  // Make sure to update this path to where your checktx.js is located
const { EmbedBuilder } = require('discord.js');
const checkForNewTransaction = require('./commands/address_scan'); // Load Address Scan functions
const trackingIntervals = new Map(); // Global map to store tracking intervals
const { ActivityType } = require('discord.js')
const db = require('./commands/database');
const { getLastTransactionHashFromDB, updateLastTransactionHashInDB } = require('./commands/dbUtils');

const addressMap = {};

const client = new Client({ intents: [GatewayIntentBits.Guilds] }); // Create a new client instance

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async c => {
    try {
        console.log(`Ready! Logged in as ${c.user.tag}`);
		client.user.setActivity(
			{
				name: '213',
				type: ActivityType.Streaming,
				url: 'https://www.twitch.tv/baronvonalexs',
				status: 'idle'
			}
		);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
	const query = 'SELECT * FROM tracked_addresses';
    db.query(query, (err, rows) => {
        if (err) throw err;

        for (let row of rows) {
            addressMap[row.ethAddress] = row.channelId;
            const intervalId = setInterval(() => checkForNewTransaction(client, addressMap), 5000); // check every minute
            trackingIntervals.set(row.ethAddress, intervalId);
        }
    });
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
	
		// Check if the address is already in the DB
		getLastTransactionHashFromDB(ethAddress)
			.then(hash => {
				if (hash) {
					if (trackingIntervals.has(ethAddress)) {
						interaction.reply(`The address ${ethAddress} is already being tracked.`);
						return;
					}
	
					// If not being tracked, set up the tracking interval
					addressMap[ethAddress] = channelId;
					const intervalId = setInterval(() => checkForNewTransaction(client, addressMap), 5000); // check every second
					trackingIntervals.set(ethAddress, intervalId);
					interaction.reply(`Now tracking address ${ethAddress} and will post updates in channel ${channelId}`);
					return;
				}
	
				// If address is not in the database, add it and set up the tracking interval
				const query = 'INSERT INTO tracked_addresses (ethAddress, channelId) VALUES (?, ?)';
				db.query(query, [ethAddress, channelId], (err, result) => {
					if (err) {
						// Handle error (maybe the address is already being tracked)
						interaction.reply('Error: ' + err.message);
						return;
					}
	
					// Start tracking the new address immediately
					addressMap[ethAddress] = channelId;
					const intervalId = setInterval(() => checkForNewTransaction(client, addressMap), 5000); // check every second
					trackingIntervals.set(ethAddress, intervalId);
					interaction.reply(`Now tracking address ${ethAddress} and will post updates in channel ${channelId}`);
				});
			});
	}
	
	
	if (interaction.commandName === 'stoptracking') {
		const address = interaction.options.getString('address');
	
		// Check if the address is in the database
		const checkQuery = 'SELECT * FROM tracked_addresses WHERE ethAddress = ?';
		db.query(checkQuery, [address], async (err, results) => {
			if (err) {
				console.error("Error checking database:", err);
				await interaction.reply('An error occurred. Please try again.');
				return;
			}
	
			if (results.length > 0) {
				// Address found in the database
	
				// Clear the interval if it exists
				if (trackingIntervals.has(address)) {
					clearInterval(trackingIntervals.get(address));
					trackingIntervals.delete(address);
				}
	
				// Remove the address from the addressMap
				delete addressMap[address];
	
				// Remove the address from the database
				const deleteQuery = 'DELETE FROM tracked_addresses WHERE ethAddress = ?';
				db.query(deleteQuery, [address], async (deleteErr) => {
					if (deleteErr) {
						console.error("Error removing from database:", deleteErr);
						await interaction.reply('An error occurred. Please try again.');
						return;
					}
	
					// Successfully removed the address from the database
					await interaction.reply(`Stopped tracking address ${address}.`);
				});
			} else {
				// Address not found in the database
				await interaction.reply(`No tracking found for address ${address}`);
			}
		});
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
						`Token: [${tx.tokenName}](https://etherscan.io/token/${tx.contractAddress})\n` +
						`From: ${tx.from}\n` +
						`To: ${tx.to}\n` +
						`Value: ${tx.value} Tokens\n` +
						`Transaction Fee: ${tx.txnFee} ETH\n`
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
