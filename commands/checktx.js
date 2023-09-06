const axios = require('axios');

const etherscanApiKey = 'KGC77JS1HI69PIUB41WPCXP2P92QCEZJR5'; // Replace with your Etherscan API Key

async function getTransactionDetails(ethAddress) {
    try {
        const response = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${ethAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`);
        const transactions = response.data.result.slice(0, 10); // Get last 10 transactions

        const transactionDetails = transactions.map(tx => {
            return {
                date: new Date(tx.timeStamp * 1000).toLocaleString(),
                method: tx.input === '0x' ? 'ETH Transfer' : 'Contract Execution',
                from: tx.from,
                to: tx.to,
                value: parseFloat(tx.value) / 1e18,
                txnFee: parseFloat(tx.gasPrice) * parseFloat(tx.gasUsed) / 1e18
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
    try {
        const transactions = await getTransactionDetails(ethAddress);
        const transactionsPerPage = 3; // Number of transactions to display per page
        const maxPages = Math.ceil(transactions.length / transactionsPerPage);

        if (maxPages === 0) {
            await interaction.reply('No transactions found for this address.');
            return;
        }

        let currentPage = 1;
        const maxPagination = 5; // Maximum number of pages to display

        const sendTransactionPage = async (page) => {
            const startIdx = (page - 1) * transactionsPerPage;
            const endIdx = startIdx + transactionsPerPage;
            const pageTransactions = transactions.slice(startIdx, endIdx);

            let reply = `**Page ${page} - Last ${pageTransactions.length} transactions:**\n\n`;

            pageTransactions.forEach((tx, index) => {
                reply += `**Transaction ${startIdx + index + 1}**\n`;
                reply += `Date: ${tx.date}\n`;
                reply += `Method: ${tx.method}\n`;
                reply += `From: ${tx.from}\n`;
                reply += `To: ${tx.to}\n`;
                reply += `Value: ${tx.value} ETH\n`;
                reply += `Transaction Fee: ${tx.txnFee} ETH\n\n`;
            });

            await interaction.reply(reply);
        };

        // Function to handle pagination buttons
        const handlePagination = async (btnInteraction, pageChange) => {
            if (!isNaN(pageChange) && pageChange >= 1 && pageChange <= maxPages) {
                currentPage = pageChange;
                await sendTransactionPage(currentPage);
                await btnInteraction.update({
                    content: `**Page ${currentPage}**`,
                    components: generatePaginationButtons(),
                });
            }
        };

        // Function to generate pagination buttons
        const generatePaginationButtons = () => {
            const buttons = [];
            if (currentPage > 1) {
                buttons.push({
                    type: 'BUTTON',
                    customId: 'tx_page_prev',
                    label: 'Previous',
                    style: 'PRIMARY',
                });
            }
            if (currentPage < maxPages && currentPage < maxPagination) {
                buttons.push({
                    type: 'BUTTON',
                    customId: 'tx_page_next',
                    label: 'Next',
                    style: 'PRIMARY',
                });
            }
            return [
                {
                    type: 'ACTION_ROW',
                    components: buttons,
                },
            ];
        };

        // Send the initial page with pagination buttons
        await sendTransactionPage(currentPage);
        await interaction.editReply({
            content: `**Page ${currentPage}**`,
            components: generatePaginationButtons(),
        });

        const filter = (btnInteraction) => {
            return (
                (btnInteraction.customId === 'tx_page_prev' || btnInteraction.customId === 'tx_page_next') &&
                btnInteraction.user.id === interaction.user.id
            );
        };

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (btnInteraction) => {
            const pageChange = btnInteraction.customId === 'tx_page_prev' ? currentPage - 1 : currentPage + 1;
            await handlePagination(btnInteraction, pageChange);
        });

        collector.on('end', () => {
            // Remove the interaction collector when it's done
            collector.stop();
        });
    } catch (error) {
        console.error('Error in handleCheckTx:', error);
        await interaction.reply('An error occurred while fetching transactions.');
    }
}

module.exports = {
    getTransactionDetails, // Exporting getTransactionDetails function
    handleCheckTx  // Exporting the handleCheckTx function
};
