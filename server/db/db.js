const mysql = require('mysql');
require('dotenv').config();

// $ mysql -h <host> -u <username> -p --ssl-mode=DISABLED     # lets you remotely access heroku database CLI

class Database {

    // if there is an error connecting, try to setup again with set timeout
    static connect() {
        Database.db.connect(err => {
            if (err) { 
                console.log(`Error connecting to DB`);
                console.log(`Maybe you need to start MySQL with: $ sudo service mysql start`);
                setTimeout(Database.setUp, 2000);
            } else { 
                console.log(`Connected to DB`);
            }
        });
    }

    // So far don't need to use this
    static disconnect() {
        Database.db.end(err => {
            if (err) { return console.log(`Error disconnecting from DB`); }
            console.log(`Disconnected from DB`);
        });
    }

    // insert keyword and response into the DB
    static insertKeyword(keyword, response) {
        // the ?'s are placeholders for variables, they escape characters for us so something like the ' character cant mess up our query
        let sql = `INSERT INTO keywords (keyword, response) VALUES (?, ?)`;
        // pass the query string, the variables the take the palce of the ?'s in an array, and a callback function
        Database.db.query(sql, [keyword, response], (err, result) => {
            if (err) { return console.log('Error Inserting')};
        });
    }

    // delete a keyword record from the database based on id
    static deleteKeyword(id) {
        // use the same ? technique as insertKeyword
        let sql = `DELETE FROM keywords WHERE id = ?`;
        Database.db.query(sql, [id], (err, result) => {
            if (err) { return console.log('Error Deleting')};
        });
    }

    // takes a callback function that can process the results of the query
    static getKeywords(fn) {
        Database.db.query('SELECT * FROM keywords', (err, result) => {
            if (err) { fn(err, null); }
            else { fn(err, result); }
        });
    }

    // call this on setup -- recall it anytime we encounter an error -- we need to do this for heroku stuff to work properly and disconnect gracefully
    static setUp() {

        // get a new connection anytime we setup since the old one is broken
        Database.db = mysql.createConnection(Database.config);
        // connect with the new connection
        Database.connect();

        // on an error, try to setup again if it is a connection lost error, otherwise there is a severe error
        Database.db.on('error', err => {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.log('DATABASE CONNECTION LOST');
                Database.setUp();
            } else {
                console.log(`UNKNOWN DATABASE ERROR ${err}`);
                throw err;
            }
        });
    }
}

// The database will use the credentials from the `.env` file if we run locally. Will use heroku config vars otherwise
Database.config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
}

// export the database class to be used in app.js
module.exports = Database;