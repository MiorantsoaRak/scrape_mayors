import puppeteer, {Browser, Page} from "puppeteer";
import {Mayor} from './mayor';

let browser: Browser;
let page:Page;

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

async function getCityLink(regionLink: string, mayors: Mayor[] = []) {
    let hasNextPage = true;
    try{
        console.log('Getting mayors from', regionLink);
        await page.goto(regionLink);

        const scrapedData  = await page.evaluate((mayors) => {
            const mayorLinks = document.querySelectorAll(".list-group-item a");
            const element = document.querySelectorAll(".list-group-item")
            const titleElement = document.querySelector('h1.post-title');
            const nextButton = document.querySelector('.pagination-wrapper .next.page-numbers');

            const region = titleElement.textContent
                .replace('Maires ', '')
                .replace('région ', '')

            for (let i = 0; i < mayorLinks.length; i++) {
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

                mayor.cityHallUrl = mayorLinks[i].getAttribute('href');
                const parts = element[i].textContent.split(' - ');
                mayor.city = parts[0].trim();
                mayor.name = parts[1].trim();
                mayor.region = region;

                mayors.push(mayor);
            }

            return  {mayors, nextButton: nextButton ? nextButton.getAttribute('href') : null};
        }, mayors);

        mayors = scrapedData.mayors;
        let nextPage = scrapedData.nextButton;

        if(nextPage) {
            return  getCityLink(nextPage, mayors);
        }
        else {
            return mayors;
        }
    } catch (e) {
        console.log('Error getting mayors from', regionLink);
        console.log(e);
        return mayors;
    }
}

async function getMayorInfo(mayor: Mayor) {
    console.log('Getting mayor info from', mayor.cityHallUrl);
    await page.goto(mayor.cityHallUrl);

    return  await page.evaluate((mayor: Mayor) => {
        const pElement = document.querySelectorAll('p');
        const matchDate = pElement[1].textContent.match(/pris ses fonctions en tant que maire le (\d{2}\/\d{2}\/\d{4})/);
        mayor.date = matchDate ? matchDate[1] : '';

        const phoneElement = document.querySelector('span[itemprop="telephone"]');
        mayor.phoneNumber = phoneElement.textContent;

        const emailElement = document.querySelector('span[itemprop="email"]');
        mayor.email = emailElement.textContent;

        const addressElement = document.querySelector('span[itemprop="address"]');
        mayor.address = addressElement.textContent.replace(/\s{2,}/g, ' ').trim();//remove extra spaces

        return mayor;
    }, mayor);

}

async function extractMayorData() {
    await init();

    const regionLinks = await getRegionLinks();
    const mayorWithLinks : Mayor[] = [];
    const mayors: Mayor[] = [];

    for (const regionLink of regionLinks) {
        const cityLink = await getCityLink(regionLink);
        mayorWithLinks.push(...cityLink);
    }

    for (const mayor of mayorWithLinks) {
        const mayorInfo = await getMayorInfo(mayor);
        mayors.push(mayorInfo);
    }

    console.log(mayors);

    await browser.close();
}

(async () => {
    await extractMayorData()
})();