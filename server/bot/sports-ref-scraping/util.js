const puppeteer = require('puppeteer');

const navigateToPlayer = async (sport, player) => {

    const link = getSportLink(sport);

    const browser = await puppeteer.launch({
        args: [
            '--window-size=650,550',
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

    return { browser, page };
}

const getSportLink = (sport) => {
    if (sport === 'football') { sport = 'pro-football'; }
    let link = `https://www.${sport}-reference.com`;
    if (sport === 'soccer') { link = `https://fbref.com/en/`; }

    return link;
}

module.exports = {
    navigateToPlayer,
    getSportLink
}