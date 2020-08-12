const discord = require('discord.js');      // discord bot api for nodejs
const fetch = require('node-fetch');        // fetch api in nodejs
const moment = require('moment-timezone');  // great library for manipulating and fromatting dates/times/timezones
require('dotenv').config();                 // lets us use environment variables from '.env' file. Important for hiding discord bot api key

// IMPORT bot functionality
const checkDbKeywords = require('./keywords');
const getPlayer = require('./scraping/screenshot');

// create the bot and login with the login token we got from the discord dev center
const bot = new discord.Client();
// this bot token should be stored in the .env file so we can hide
const token = process.env.BOT_TOKEN;
bot.login(token);


// when the bot is ready just log a basic message
bot.on('ready', () => console.log('Bot is up and running'));

bot.on('message', msg => {
    
    // do nothing if the message is from any bot
    if (msg.author.bot) { return; }

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
        else if (moment(argv[1]).isValid())  {
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

    else if (argv[0] === '$player') {
        let player = argv[1];
        getPlayer(player, msg);
    }

    // tell the user they are stupid
    else {
        msg.channel.send(`${msg.author} What are you, a dummy? That's not a command.`);
    }
});

// converts number to form of 1st, 2nd, 3rd, 4th, etc
function ordinalSuffixOf(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

// this function is THICK. 
function sendGames(date, msg) {
    // fetch the api string with the given date
    fetch(`https://statsapi.web.nhl.com/api/v1/schedule?date=${date}`)
        // convert the fetch results to a javascript object
        .then(res => res.json())
        // sched is the javascript object returned in the .then above
        .then(sched => {

            // convert the date to the full format like this - August 3, 2020
            let gameDate = moment(date).format('LL');

            // send an initial message that says the date of all the games
            msg.channel.send(`NHL games on ${gameDate}`)
            // react to the message we just sent above
            .then(dateMsg => dateMsg.react('🏒'))
            // after we react, do the following
            .then(() => {

                let games;

                // check try to get the games. there will be an error if there are no games so we catch to send a no games message
                try {
                    games = sched.dates[0].games;
                } catch (err) {
                    msg.channel.send(`There is no hockey 😭`)
                    .then(gameMsg => {
                        gameMsg.react('😾')
                        .then(() => gameMsg.react('👎'))
                        .catch(err => console.log('sad emoji troubles'));
                    })
                    // return so nothing below is executed
                    return;
                }

                // we wrap our loop in an async function so we can await our sent messages to guarantee they maintain the correct order game order
                (async function loop() {
                    // for each game
                    for (let i in games) {
            
                        // get the time of the game and use moment to convert it to the format like this - 7:30 PM
                        let utcDate = moment(games[i].gameDate);
                        let time = utcDate.tz('America/Chicago').format('h:mm A');
    
                        let away = games[i].teams.away.team.name;
                        let home = games[i].teams.home.team.name;

                        // respond with the game time, the away team, and the home team
                        let response = `${time}\n${away} @ ${home}`;

                        // if the game is in progress or has already happened
                        if (games[i].status.detailedState !== 'Scheduled') {
                            let awayScore = games[i].teams.away.score;
                            let homeScore = games[i].teams.home.score;

                            // respond with the score, say who is winning if the game isn't tied
                            if (awayScore > homeScore) { response += `\n${awayScore} - ${homeScore} ${away}`}
                            else if (awayScore < homeScore) { response += `\n${homeScore} - ${awayScore} ${home}`}
                            else { response += `\n${homeScore} - ${awayScore}`}
                        }
                        
                        // await the sent message so the next one we send can only be sent after this one
                        await msg.channel.send(response)
                        // react to the message sent above with a bus for away teams
                        .then(gameMsg => {
                            gameMsg.react('🚌')
                            // after we react to the bus, react with homes for the home team - this is in its own .then() so we ensure it always comes after the bus
                            .then(() => gameMsg.react('🏘️'))
                            .catch(err => console.log('emoji troubles'));
                        })
                        .catch(err => console.log('Error sending game'));
                    }
                })();
            })
            .catch(err => console.log('Error sending game date'));
        })
        .catch(err => console.log(`Error fetching schedule`));
}


function sendDraftPick(year, pick, msg) {
    fetch(`https://statsapi.web.nhl.com/api/v1/draft/${year}`)
    .then(res => res.json())
    .then(draft => {

        // if there were no draft picks
        if (!draft.drafts[0].rounds) {

            let currentYear = moment().year();
            let messageYear = parseInt(year);
            
            // if the year in the message is >= to the current year, let's send a random future player
            if (messageYear >= currentYear) {
                let pickOverall = ordinalSuffixOf(pick);
                sendRandomTeamPlayer(msg, pickOverall);
                return;
            } else {   
                msg.channel.send(`Nobody was picked in that year.\nFormat is:\n$draft year overall-pick`)
                .catch(err => console.log('error sending bad draft year'));
                return;
            }
        }

        // loop through each round
        let rounds = draft.drafts[0].rounds;
        for (let i in rounds) {
            // loop through each pick in the current round
            let picks = rounds[i].picks;
            for (let j in picks) {

                // get all of these attrubutes
                let round = ordinalSuffixOf(picks[j].round);
                let pickOverall = ordinalSuffixOf(picks[j].pickOverall);
                let pickInRound = ordinalSuffixOf(picks[j].pickInRound);
                let team = picks[j].team.name;
                let prospect = picks[j].prospect.fullName;
                // if the current draftee's pick === the pick the user wanted
                if (pick === picks[j].pickOverall) {


                    let pickMessage;
                    // we'll say `blank` overall if its the first round, other wise we'll say round and pick in round
                    if (picks[j].round == 1) {
                        pickMessage = `With the ${pickOverall} overall pick,`
                    } else {
                        pickMessage = `With the ${pickInRound} pick in the ${round} round,`
                    }

                    // send the draft message
                    let response = `${pickMessage} the ${team} select ${prospect}.`
                    msg.channel.send(response)
                    .then(draftMessage => {
                        draftMessage.react('🏒')
                        .catch(err => console.log('Error reacting to the draft pick'));
                    })
                    .catch(err => console.log('error sending draft man'));
                    // return so we stop looping
                    return;
                }
            }
        }
        msg.channel.send(`Couldn't find that pick number.\nFormat is:\n$draft year overall-pick`)
        .catch(err => console.log('error sending bad draft pick'));
        return;
    })
    .catch(err => console.log(`error getting draft man ${err}`))
}

function sendRandomTeamPlayer(msg, pick) {
    // get a random city
    fetch(`http://names.drycodes.com/1?nameOptions=cities&combine=1&separator=space`)
    .then(res => res.json())
    .then(cities => {
        // get the city
        let city = cities[0];
        // get a random object
        fetch(`http://names.drycodes.com/1?nameOptions=objects&combine=1&separator=space`)
        .then(res => res.json())
        .then(names => {
            // make the team name the random object
            let team = names[0];
            // make the team name plural if its not
            if (team[team.length - 1] !== 's') { team += 's'; }

            // get a random boy name
            fetch(`http://names.drycodes.com/1?nameOptions=boy_names&separator=space`)
            .then(res => res.json())
            .then(players => {
                let player = players[0];
                // respond with the random data in the draft pick format
                let response = `With the ${pick} overall pick, the ${city} ${team} select ${player}.`;
                msg.channel.send(response)
                .catch(err => console.log(`error sending fake player`));
            })
            .catch(err => console.log('error getting fake player name'));

        })
        .catch(err => console.log(`error getting random objects`))
    })
    .catch(err => console.log(`error getting random cities`))
}

module.exports = bot;