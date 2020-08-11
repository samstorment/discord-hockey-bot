const express = require('express');         // routes
const bodyParser = require('body-parser');  // needed to parse HTTP request body as JSON properly
const path = require('path');               // lets us use file paths independent of OS
require('./server/bot/bot');                // import our bot so all of our bot commands actually work
const db = require('./server/db/db');       // import db so we can use db functions

db.setUp(); // we need to call this once to get our db setup loop working
const app = express();

// thell express what are views folder is and tell express the view engine
app.set('views', path.join(__dirname, 'client'));
app.set('view engine', 'pug');
// tell express we want to parse request body's as json
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// on the home route, get the database keywords and render the keywords.pug file, passing the keywords to the pug file
app.get('/', (req, res) => {
    db.getKeywords((err, keywords) => {
        res.render('keywords', { items: keywords });
    });
});

// when someone makes a POST to /add
app.post('/add', (req, res) => {

    // get the keyword and response from the post body - this is where express.json and bodyParser are used
    let keyword = req.body.keyword;
    let response = req.body.response;

    // insert the keyword and response into the database then redirect the user back to the home route
    db.insertKeyword(keyword, response);
    
    res.redirect('/');
});

// when someone makes a POST to /delete
app.post('/delete', (req, res) => {

    // get the id of the record we want to delete, delete it from the DB, then redirect the user
    let id = req.body.id;
    db.deleteKeyword(id);
    res.redirect('/');
});

// listen on the heroku port, or 5000 if we are running locally
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`listening on port ${port}`));