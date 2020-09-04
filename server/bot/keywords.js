const db = require('../db/db');   // lets us use the db, don't need to call setup here because we've already called in in app.js

function checkDbKeywords(msg, content) {

    // if the message is to the general channel just do nothing. these messages are too spammy in general
    if (msg.channel.id == '265396584899018752') { return; }

    // get all the keywords in the database and check if the message sent contains a keyword
    db.getKeywords((err, keywords) => {
        // look at each keyword
        for (i in keywords) {
            // get the keyword and the response - put the keyword to lower for easier comparison
            let keyword = keywords[i].keyword.toLowerCase();
            let response = keywords[i].response;

            // if the message includes the keyword, reply with that keyword's response
            if (content.includes(keyword)) {
                msg.channel.send(response);
            }
        }  
    });
}

module.exports = checkDbKeywords;