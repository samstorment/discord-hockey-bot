const fetch = require('node-fetch');        // fetch api in nodejs
const moment = require('moment-timezone');  // great library for manipulating and fromatting dates/times/timezones

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


module.exports = sendGames;