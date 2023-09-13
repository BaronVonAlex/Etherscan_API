const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js'); // Changed to MessageEmbed
const tokenTypes = require('./tokenTypes'); // Assumed you have a tokenTypes.js

const sentTransactionHashes = new Set();


// Wei to Ether function for Formatting API Value -> Discord.JS Embed respose
function weiToEther(wei) {
    // let base = '1000000000000000000'; 
    let weiStr = wei.toString();
  
    if (weiStr.length < 18) {
      weiStr = weiStr.padStart(18, '0');
    }
  
    let wholePart = weiStr.slice(0, -18) || '0';
    let fractionalPart = weiStr.slice(-18).slice(0, 2);
  
    return `${parseInt(wholePart).toLocaleString('en-US')}.${fractionalPart}`;
  }

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
            
            //fs.writeFileSync('api_response.json', JSON.stringify(response.data, null, 2));
            // API_RESPONSE COMMAND This not needed for anything
            // we can track Actual response in main folder api_response.json

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

            const formattedValue = weiToEther(latestTransaction.value);

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
                        { name: 'Value', value: formattedValue},
                        { name: 'Token Name', value: `[${tokenTypes[latestTransaction.contractAddress] || latestTransaction.tokenName || "N/A"}](https://etherscan.io/token/${latestTransaction.contractAddress})` },
                        { name: 'Token Symbol', value: latestTransaction.tokenSymbol}
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Transaction alert', iconURL: 'https://cdn.discordapp.com/attachments/673578061895041030/1151517275766136932/imokk1740cs91.png' });

                const channel = await client.channels.fetch(channelId);
                channel.send({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error('Error in checkForNewTransaction:', error);
    }
}

module.exports = checkForNewTransaction;
