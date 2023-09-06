const axios = require('axios');
const fs = require('fs');
const path = require('path'); // Import the 'path' module for handling file paths
const { EmbedBuilder } = require('discord.js');

const sentTransactionHashes = new Set(); // Create a Set to store sent hashes

async function checkForNewTransaction(client, addressMap) {
    try {
        for (const [ethAddress, channelId] of Object.entries(addressMap)) {
            // Create the folder if it doesn't exist
            if (!fs.existsSync('TXHash')) {
                fs.mkdirSync('TXHash');
            }

            // Read the last transaction hash from a file
            const fileName = path.join('TXHash', 'lastTransactionHash.txt'); // Use the 'path' module to join folder and file name
            let lastTransactionHash = fs.existsSync(fileName) ? fs.readFileSync(fileName, 'utf8') : '';

            const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
            const response = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${ethAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`);
            const transactions = response.data.result;

            if (transactions.length === 0) {
                continue;
            }

            const latestTransaction = transactions[0];

            if (lastTransactionHash === '') {
                lastTransactionHash = latestTransaction.hash;
                fs.writeFileSync(fileName, lastTransactionHash, 'utf8');  // Save to file
                continue;
            }

            if (latestTransaction.hash !== lastTransactionHash) {
                if (sentTransactionHashes.has(latestTransaction.hash)) {
                    continue; // Skip this iteration if the hash has already been sent
                }

                if (typeof latestTransaction.hash === 'undefined') {
                    console.warn('Received undefined hash. Skipping this iteration.');
                    continue;
                }

                lastTransactionHash = latestTransaction.hash;
                fs.writeFileSync(fileName, lastTransactionHash, 'utf8');  // Update the file

                // Add the hash to the sentTransactionHashes Set
                sentTransactionHashes.add(latestTransaction.hash);

                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('New Transaction')
                    .setDescription(`Ethereum Address: ${ethAddress}`)
                    .addFields(
                        { name: 'Transaction Hash', value: latestTransaction.hash },
                        { name: 'From', value: latestTransaction.from },
                        { name: 'To', value: latestTransaction.to },
                        { name: 'Value', value: `${parseFloat(latestTransaction.value) / 1e18} ETH` }
                    )                    
                const channel = await client.channels.fetch(channelId);
                channel.send({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error('Error in checkForNewTransaction:', error);
    }
}

module.exports = checkForNewTransaction;
