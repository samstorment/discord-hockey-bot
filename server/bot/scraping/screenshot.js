const puppeteer = require('puppeteer');
const path = require('path');

async function getPlayer(sport, player, msg) {

    if (sport === 'football') { sport = 'pro-football'; }
    let link = `https://www.${sport}-reference.com`;
    if (sport === 'soccer') { link = `https://fbref.com/en/`; }

    const browser = await puppeteer.launch({
        args: [
            '--window-size=600,500',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        // headless: false,
        defaultViewport: null
    });
    const page = await browser.newPage();
    await page.goto(link);

    // type into the player's name into the input box. the delay is the time between key presses - longer makes it seem more human
    await page.type('.ac-input', player, { delay: 50 });

    // find the first result in the search box dropdown and click that bad boy
    await page.evaluate(() => {
        let firstResult = document.querySelector('.ac-suggestions');
        firstResult.firstElementChild.click();
    });

    // wait for all the images on the page to load before screenshotting
    await page.waitForFunction(() => {
        return Array.from(document.images).every((i) => i.complete);
    });

    // screenshot the page's contents
    await page.screenshot({ path: path.join(__dirname, 'player.png') });

    await browser.close();

    await msg.channel.send(`Here's ${player}`, {
        files: [
            path.join(__dirname, 'player.png')
        ]
    })
    .catch(err => console.log('error sending image'));
}

module.exports = getPlayer;