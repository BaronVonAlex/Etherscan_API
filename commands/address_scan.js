const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js'); // Changed to MessageEmbed
const tokenTypes = require('./tokenTypes'); // Assumed you have a tokenTypes.js

const sentTransactionHashes = new Set();

async function checkForNewTransaction(client, addressMap) {
    try {
        for (const [ethAddress, channelId] of Object.entries(addressMap)) {
            // Create the folder if it doesn't exist
            if (!fs.existsSync('TXHash')) {
                fs.mkdirSync('TXHash');
            }

            // Read the last transaction hash from a file
            const fileName = path.join('TXHash', `lastTransactionHash_${ethAddress}.txt`);
            let lastTransactionHash = fs.existsSync(fileName) ? fs.readFileSync(fileName, 'utf8') : '';

            const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
            const response = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${ethAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`);
            
            // fs.writeFileSync('api_response.json', JSON.stringify(response.data, null, 2));
            // API_RESPONSE COMMAND

            if (!response.data.result) {
                console.warn('No transactions found in the API response.');
                continue;
            }

            const transactions = response.data.result;

            if (transactions.length === 0) {
                continue;
            }

            const latestTransaction = transactions[0];

            if (lastTransactionHash === '') {
                lastTransactionHash = latestTransaction.hash;
                fs.writeFileSync(fileName, lastTransactionHash, 'utf8');
                continue;
            }

            // this checks if update message was sent with current HASH, if it was then it won't send again and it will wait.
            if (latestTransaction.hash !== lastTransactionHash) {
                if (sentTransactionHashes.has(latestTransaction.hash)) {
                    continue;
                }

                if (typeof latestTransaction.hash === 'undefined') {
                    console.warn('Received undefined hash. Skipping this iteration.');
                    continue;
                }

                lastTransactionHash = latestTransaction.hash;
                fs.writeFileSync(fileName, lastTransactionHash, 'utf8');

                sentTransactionHashes.add(latestTransaction.hash);

                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('New Token Transaction')
                    .setDescription(`Ethereum Address: ${ethAddress}`)
                    .addFields(
                        { name: 'Transaction Hash', value: latestTransaction.hash },
                        { name: 'From', value: latestTransaction.from },
                        { name: 'To', value: latestTransaction.to },
                        { name: 'Value', value: `${(parseFloat(latestTransaction.value) / 1e18).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` },
                        { name: 'Token Name', value: `[${tokenTypes[latestTransaction.contractAddress] || latestTransaction.tokenName || "N/A"}](https://etherscan.io/token/${latestTransaction.contractAddress})` }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Transaction alert', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

                const channel = await client.channels.fetch(channelId);
                channel.send({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error('Error in checkForNewTransaction:', error);
    }
}

module.exports = checkForNewTransaction;
