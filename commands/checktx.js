const axios = require('axios');
const { MessageEmbed } = require('discord.js');
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

async function getTransactionDetails(ethAddress, userSelectedOffset = 5, page = 1) {
    try {
        const offset = userSelectedOffset; // Default to 5 if not provided
        const response = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${ethAddress}&page=${page}&offset=${offset}&sort=desc&apikey=${etherscanApiKey}`);
        const transactions = response.data.result;

        const transactionDetails = transactions.map(tx => {
            return {
                date: new Date(tx.timeStamp * 1000).toLocaleString(),
                tokenName: tx.tokenName,
                from: tx.from,
                to: tx.to,
                value: parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal)),
                txnFee: (parseFloat(tx.gasPrice) * parseFloat(tx.gasUsed)) / 1e18
            };
        });

        return transactionDetails;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw new Error('An error occurred while fetching transactions.');
    }
}

async function handleCheckTx(interaction) {
    const ethAddress = interaction.options.getString('address');
    const amount = interaction.options.getInteger('amount') || 5;  // If amount is not provided, default to 5
    try {
        const transactions = await getTransactionDetails(ethAddress, amount); // Pass the amount to getTransactionDetails function
      
        const embed = new MessageEmbed()
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
                       `Transaction Fee: ${tx.txnFee} ETH`
            };
        });
  
        embed.addFields(fields);
  
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error details:', error);
        await interaction.reply('An error occurred while fetching transactions.');
    }
}

module.exports = {
    getTransactionDetails,
    handleCheckTx
};
