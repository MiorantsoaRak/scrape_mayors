import puppeteer, {Browser, Page} from "puppeteer";
import {Mayor} from './mayor';

let browser: Browser;
let page:Page;
let mayors: { link: string, name: string }[] = [];

async function init() {
    browser = await puppeteer.launch();
    page = await browser.newPage();
}
async function getRegionLinks() {
    await page.goto("https://www.mon-maire.fr/maires-regions");
    return  await page.evaluate(() =>
        Array.from(document.querySelectorAll(".list-group a"))
            .map((link) => link.getAttribute('href'))
    );
}

async function getCityLink(regionLink: string) {
    await page.goto(regionLink);

    let mayor: Mayor = {
        region: '',
        city: '',
        name: '',
        date: '',
        cityHallUrl: '',
        phoneNumber: '',
        email: '',
        address: ''
    };

    mayor = await page.evaluate((mayor : Mayor) => {
        mayor.cityHallUrl = document.querySelector(".list-group a").getAttribute('href');

        const element = document.querySelectorAll(".list-group-item")[0];
        const parts = element.textContent.split(' - ');
        mayor.city = parts[0].trim();
        mayor.name = parts[1].trim();

        const titleElement = document.querySelector('h1.post-title');
        mayor.region = titleElement.textContent.replace('Maires région ', '');

        return mayor;
    }, mayor);

    return mayor;
}

async function getMayorInfo(mayor: Mayor) {
    await page.goto(mayor.cityHallUrl);
    return  await page.evaluate((mayor: Mayor) => {
        const pElement = document.querySelector('p');
        const matchDate = pElement.textContent.match(/pris ses fonctions en tant que maire le (\d{2}\/\d{2}\/\d{4})/);
        mayor.date = matchDate ? matchDate[0] : '';

        const phoneElement = document.querySelector('span[itemprop="telephone"]');
        mayor.phoneNumber = phoneElement.textContent;

        const emailElement = document.querySelector('span[itemprop="email"]');
        mayor.email = emailElement.textContent;

        return mayor;
    }, mayor);

}

(async () => {
    await init();

    const regionLinks = await getRegionLinks();
    const mayorWithLinks : Mayor[] = [];
    const mayors: Mayor[] = [];

    for (const regionLink of regionLinks) {
        const cityLink = await getCityLink(regionLink);
        mayorWithLinks.push(cityLink);
    }

    for (const mayor of mayorWithLinks) {
        const mayorInfo = await getMayorInfo(mayor);
        mayors.push(mayorInfo);
    }

    console.log(mayors);

    await browser.close();
})();