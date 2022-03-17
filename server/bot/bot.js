const discord = require('discord.js');      // discord bot api for nodejs
const moment = require('moment-timezone');  // great library for manipulating and fromatting dates/times/timezones
require('dotenv').config();                 // lets us use environment variables from '.env' file. Important for hiding discord bot api key

// IMPORT bot functionality
const checkDbKeywords = require('./keywords');
const getPlayerImage = require('./sports-ref-scraping/screenshot');
const getPlayerStats = require('./sports-ref-scraping/stats');
const sendGames = require('./nhl-api/schedule');
const sendDraftPick = require('./nhl-api/draft');

// create the bot and login with the login token we got from the discord dev center
const bot = new discord.Client();
// this bot token should be stored in the .env file so we can hide
const token = process.env.BOT_TOKEN;
bot.login(token);

// when the bot is ready just log a basic message
bot.on('ready', () => console.log('Bot is up and running'));

// anytime the bot recieves a message we can react to it here
bot.on('message', msg => {

    // do nothing if the message is from any bot
    if (msg.author.bot) { return; }

    console.log(msg.author.id);

    // if the author is wade, give him some pride
    if (msg.author.id === '269992796545351681') msg.react('🏳️‍🌈');

    let message = msg.content.toLowerCase();    // convert the message to lowercase so we can parse it easier
    let argv = message.split(/[ ,]+/);          // split the message into an array of words, split by any number of spaces or commas
    let argc = argv.length;                     // argc is the number of strings in the array of arguments

    // check if the message contains any DB keywords and respond accordingly
    checkDbKeywords(msg, message);

    // if the message includes hawk, fuck em
    if (message.includes('hawk')) { msg.channel.send(`${msg.author} Fuck the Blackhawks`); }

    // if the message doesn't start with $, we dont need to look through our commands
    if (msg.content[0] !== '$') { return; }

    // --------------------------------
    // THE LOGIC in the if statments below should be moved out of here and into their own files and functions
    // --------------------------------

    // $today
    if (message === '$today') {
        // Here we use moment.js library - msg.createdTimestamp is the UTC time that the discord message was sent
        let utcDate = moment(msg.createdTimestamp);
        // convert the utcDate to Central time and format it like below, then call send games with the date
        let date = utcDate.tz('America/Chicago').format('YYYY-MM-DD');
        sendGames(date, msg);
    }

    // $tomorrow
    else if (message === '$tomorrow') {

        // same as $today but we add 1 to the date
        let utcDate = moment(msg.createdTimestamp).add(1, 'days');
        let date = utcDate.tz('America/Chicago').format('YYYY-MM-DD');
        sendGames(date, msg);
    }

    // $dayaftertomorrw
    else if (message === '$dayaftertomorrow') {

        // same as $today but we add 1 to the date
        let utcDate = moment(msg.createdTimestamp).add(2, 'days');
        let date = utcDate.tz('America/Chicago').format('YYYY-MM-DD');
        sendGames(date, msg);
    }

    // $games -- usage -> $games 10 (gets games 10 days from now)
    //           usage -> $games 08-01-1997 (gets games on that date)
    // check if there is more than one arg, makes sure the first arg is $games, and makes sure the second arg is a number
    else if (argc > 1 && argv[0] === '$games') {

        // if arg1 is a number
        if (!isNaN(argv[1])) {
            let utcDate = moment(msg.createdTimestamp).add(parseInt(argv[1]), 'days');
            let date = utcDate.tz('America/Chicago').format('YYYY-MM-DD');
            sendGames(date, msg);
        }
        // if arg1 is a valid date
        else if (moment(argv[1]).isValid()) {
            let date = moment(argv[1]).tz('America/Chicago').format('YYYY-MM-DD');
            sendGames(date, msg);
        } else {
            msg.channel.send(`That's not a valid numeric offset or date.\nExamples: $games 5, $games 05-23-78`);
        }
    }

    // $draft -- usage -> $draft 2019 7 (gets the 7th overall pick in 2019)
    else if (argv[0] === '$draft') {

        let year = argv[1];
        let pick = argv[2];
        if (!isNaN(year) && !isNaN(pick) && argc > 2) {
            sendDraftPick(year, parseInt(pick), msg);
        } else {
            msg.channel.send(`$draft needs a year and a pick number.\nFormat is:\n$draft year overall-pick`)
                .catch(err => console.log('error sending $draft formatting tips'));
        }
    }

    // send the link to the command help
    else if (argv[0] === '$help') {
        msg.channel.send(`https://discord-hockey-bot.herokuapp.com/help`)
            .catch(err => console.log('error sending help link'));
    }

    else if (argv[0] === '$hockey' || argv[0] === '$baseball' || argv[0] === '$football' || argv[0] === '$basketball' || argv[0] === '$soccer') {

        let sport = argv[0].slice(1);           // sport is the first arg without the $

        let player = argv.slice(1).join(' ');   // player is every value in the array of args joined together as a space separated stirng
        
        if (!player) {
            msg.channel.send('Provide a player name like: $baseball trout');
            return;
        }

        getPlayerImage(sport, player, msg);
    }

    else if (argv[0] === '$stats') {
        let sport = argv[1];
        let player = argv.slice(2).join(' ');
        
        // if (sport === 'hockey' || sport === 'baseball' || sport === 'football' || sport === 'basketball' || sport === 'soccer') {
        if (sport === 'baseball') {
            getPlayerStats(sport, player, msg);
        } else {
            msg.channel.send(`Sorry dog we've only got baseball for now`);
        }
    }

    // when a message is recieved starting with $dog...
    else if (argv[0] === '$dog') {

        // send "I LOVE DOGS"
        msg.channel.send('I LOVE DOGS!')
        .then(dogMsg => {
            // react to the dogMsg (The one that says 'I LOVE DOGS')
            dogMsg.react('🥳')
            // after we send the party guy reaction, send the elephant reaction. If we didn't put the elephant reaction in the .then(), we'd have no guarantee of the order of the reactions
            .then(() => dogMsg.react('🐘'))
            .catch(err => console.log('emoji error'));
        })
        .catch(err => console.log(`Error sending message: ${err}`)); // catch any errors sending the message
    }

    // tell the user they are stupid
    else {
        msg.channel.send(`${msg.author} What are you, a dummy? That's not a command.`);
    }
});


module.exports = bot;