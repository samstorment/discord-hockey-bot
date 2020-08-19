const fetch = require('node-fetch');

// interval is in minutes, 25min by default for a heroku app
function ping(url, interval = 25) {
    // timeout in milliseconds
    const timeout = interval * 60000;

    setTimeout(async () => {
        // fetch the url every 25minutes
        try {
            await fetch(url);
            console.log(`Pinged ${url}`);
        } catch (err) {
            console.log(`Error fetching ${url}`);
        } finally {
            return ping(url, interval);
        }
    }, timeout);
}

module.exports = ping;