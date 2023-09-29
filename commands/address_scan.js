const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js'); // Changed to MessageEmbed
const tokenTypes = require('./tokenTypes'); // Assumed you have a tokenTypes.js
const db = require('./database');
const { getLastTransactionHashFromDB, updateLastTransactionHashInDB } = require('./dbUtils');

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
    console.log("Checking for new transactions...");
    try {
        for (const [ethAddress, channelId] of Object.entries(addressMap)) {
            console.log(`Checking for address: ${ethAddress}`);
            let lastTransactionHash = await getLastTransactionHashFromDB(ethAddress);

            const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
            const response = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${ethAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`);

            if (!response.data.result) {
                console.warn('No transactions found in the API response.');
                continue;
            }

            const transactions = response.data.result;
            if (transactions.length === 0) {
                continue;
            }

            const latestTransaction = transactions[0];
            console.log(`Latest transaction hash for ${ethAddress}: ${latestTransaction.hash}`); // Add this
            const formattedValue = weiToEther(latestTransaction.value);

            if (latestTransaction.hash !== lastTransactionHash) {
                if (sentTransactionHashes.has(latestTransaction.hash)) {
                    continue;
                }

                await updateLastTransactionHashInDB(ethAddress, latestTransaction.hash);

                sentTransactionHashes.add(latestTransaction.hash);

                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('New Token Transaction')
                    .setDescription(`Ethereum Address: ${ethAddress}`)
                    .addFields(
                        { name: 'Transaction Hash', value: latestTransaction.hash },
                        { name: 'To', value: latestTransaction.to },
                        { name: 'Value', value: formattedValue },
                        { name: 'Token Name', value: `[${tokenTypes[latestTransaction.contractAddress] || latestTransaction.tokenName || "N/A"}](https://etherscan.io/token/${latestTransaction.contractAddress})` },
                        { name: 'Token Symbol', value: latestTransaction.tokenSymbol }
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
