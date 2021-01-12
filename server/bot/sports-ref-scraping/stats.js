const { navigateToPlayer } = require("./util");
const discord = require('discord.js');

const getPlayerStats = async (sport, player, msg) => {

    const { browser, page } = await navigateToPlayer(sport, player);

    
    await page.waitForSelector('#batting_standard', { visible: true });

    const cols = await page.evaluate(() => {
        const ths = Array.from(document.querySelectorAll('#batting_standard thead tr th'));
        return ths.map(th => th.innerText);
    });

    const rows = await page.evaluate(() => {
        const fullRows = Array.from(document.querySelectorAll('#batting_standard tbody .full'));

        const rowData = fullRows.map(r => {
            const tds =  Array.from(r.querySelectorAll('td'));
            const th = r.querySelector('th').innerText;
            const colData =  tds.map(td => td.innerText);
            return [ th, ...colData ];
        });

        return rowData;
    });

    const ths = cols.map(c => `<th style="border-bottom:1px solid black;padding:5px;">${c}</th>`);

    const trs = rows.map(r => {
        const tds = r.map(c => `<td style="border-bottom:1px solid black;padding:5px;">${c}</td>`)

        return `<tr>${tds.join('')}</tr>`
    });
        
    const html = `<table>
        <thead>
            <tr>${ths.join('')}</tr>
        </thead>
        <tbody>${trs.join('')}</tbody>
    </table>`;

    console.log(html);

    await page.setContent(html);

    await page.setViewport({
        height: 800,
        width: 1500
      });

    const imageBuffer = await page.screenshot({});

    msg.channel.send(`Here's ${player}`, {
        files: [
            imageBuffer
        ]
    });

    browser.close();
}

module.exports = getPlayerStats;
