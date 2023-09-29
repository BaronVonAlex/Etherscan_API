const sqlUser = process.env.SQL_USER;
const sqlPass = process.env.SQL_PASS;

const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: sqlUser,
    password: sqlPass, // If you've set a password for MySQL in XAMPP, provide it here.
    database: 'eth_tracking'
});

db.connect(err => {
    if (err) {
        throw err;
    }
    console.log('Connected to the database.');
});

process.on('exit', () => {
    db.end();
});

module.exports = db;
