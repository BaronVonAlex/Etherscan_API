const axios = require('axios');

const etherscanApiKey = 'KGC77JS1HI69PIUB41WPCXP2P92QCEZJR5'; // Replace with your Etherscan API Key

async function getTransactionCount(ethAddress) {
    try {
        const response = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${ethAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${etherscanApiKey}`);
        const transactions = response.data.result;
        return transactions.length;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw new Error('An error occurred while fetching transactions.');
    }
}

module.exports = {
    getTransactionCount
};