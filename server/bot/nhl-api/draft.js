const fetch = require('node-fetch');        // fetch api in nodejs
const moment = require('moment-timezone');  // great library for manipulating and fromatting dates/times/timezones

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

// sends a random player using some different apis to get random data
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

module.exports = sendDraftPick;