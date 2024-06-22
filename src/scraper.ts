import puppeteer from "puppeteer";
import * as fs from 'fs';

import {Mayor} from './mayor';
import {getRegionLinks, scrapMayorInfoFromRegionLink, completeMayorInfo} from './scrapeFunctions';

async function extractMayorData() {
    const browser = await puppeteer.launch();

    try{
        const regionLinks = await getRegionLinks();
        const mayors: Mayor[] = [];

        for (const regionLink of regionLinks) {
            const regionMayors = await scrapMayorInfoFromRegionLink(browser, regionLink);
            for(const mayor of regionMayors) {
                const mayorInfo = await completeMayorInfo(browser, mayor);
                mayors.push(mayorInfo);
            }
        }

        const csvData = mayors.map(mayor => [
            `"${mayor.region}"`,
            `"${mayor.city}"`,
            `"${mayor.name}"`,
            `"${mayor.date}"`,
            `"${mayor.phoneNumber}"`,
            `"${mayor.email}"`,
            `"${mayor.address}"`,
            `"${mayor.cityHallUrl}"`
        ]).join('\n');

        createCsvFile(`Région,Ville,Nom du maire,Date de prise de fonction,Téléphone,Email,Adresse mairie,URL\n${csvData}`);
    } catch (e) {
        console.log(e);
    } finally {
        console.log('Done');
        await browser.close();
        process.exit(0);
    }
}

function createCsvFile(csvData: string, fileName = 'mayors.csv') {
    fs.writeFileSync(fileName, csvData);
}

(async () => {
    await extractMayorData()
})();