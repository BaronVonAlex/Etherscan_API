1. Check if the folder exists: If the folder TXHash doesn't exist, it's created.

2. Read the last transaction hash: The last transaction hash for the specific Ethereum address is read from a file (lastTransactionHash_${ethAddress}.txt). 
If the file doesn't exist, lastTransactionHash is set to an empty string.

3. Fetch the latest transactions: A request is made to the Etherscan API to fetch the latest transactions for the Ethereum address.

4. Check for new transactions: If the latest transaction hash is different from the lastTransactionHash read from the file
, and it hasn't been sent before (checked using the sentTransactionHashes set), then:

The new hash is written to the file, updating lastTransactionHash.
The new hash is added to the sentTransactionHashes set to ensure it won't be sent again.
A Discord embed message is created and sent to the specified channel with the details of the new transaction.

So, in summary, your code will update the lastTransactionHash in the file and add the new hash to the sentTransactionHashes set to ensure it's not sent again. 
It will then send a message to the Discord channel with the details of the new transaction.
