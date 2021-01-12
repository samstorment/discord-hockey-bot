const path = require('path');
const { navigateToPlayer } = require('./util');

async function getPlayerImage(sport, player, msg) {

    const { browser, page } = await navigateToPlayer(sport, player);

    // wait for all the images on the page to load before screenshotting
    await page.waitForFunction(() => {
        return Array.from(document.images).every((i) => i.complete);
    });

    // wait an extra second to try to let everything load. This is a hacky fix, but easy
    await page.waitFor(2000);

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

module.exports = getPlayerImage;