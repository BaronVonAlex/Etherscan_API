const db = require('./database');

function getLastTransactionHashFromDB(ethAddress) {
    return new Promise((resolve, reject) => {
        const checkQuery = 'SELECT lastTransactionHash FROM tracked_addresses WHERE ethAddress = ?';
        db.query(checkQuery, [ethAddress], (err, results) => {
            if (err) {
                reject(err);
                return;
            }

            if (results.length > 0) {
                resolve(results[0].lastTransactionHash);
            } else {
                resolve('');
            }
        });
    });
}

function updateLastTransactionHashInDB(hash, ethAddress) {
    return new Promise((resolve, reject) => {
        const updateQuery = 'UPDATE tracked_addresses SET lastTransactionHash = ? WHERE ethAddress = ?';
        db.query(updateQuery, [hash, ethAddress], (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

module.exports = {
    getLastTransactionHashFromDB,
    updateLastTransactionHashInDB
};