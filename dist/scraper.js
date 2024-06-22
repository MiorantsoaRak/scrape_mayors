"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = require("puppeteer");
const fs = require("fs");
function getRegionLinks() {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch();
        const page = yield browser.newPage();
        yield page.goto("https://www.mon-maire.fr/maires-regions");
        return yield page.evaluate(() => Array.from(document.querySelectorAll(".list-group a"))
            .map((link) => link.getAttribute('href')));
    });
}
function scrapMayorInfoFromRegionLink(browser_1, regionLink_1) {
    return __awaiter(this, arguments, void 0, function* (browser, regionLink, mayors = []) {
        let hasNextPage = true;
        console.log('Getting mayors from', regionLink);
        const page = yield browser.newPage();
        try {
            yield page.goto(regionLink);
            const scrapedData = yield page.evaluate((mayors) => {
                const mayorLinks = document.querySelectorAll(".list-group-item a");
                const element = document.querySelectorAll(".list-group-item");
                const titleElement = document.querySelector('h1.post-title');
                const nextButton = document.querySelector('.pagination-wrapper .next.page-numbers');
                const region = titleElement.textContent
                    .replace('Maires ', '')
                    .replace('région ', '');
                for (let i = 0; i < 1; i++) {
                    let mayor = {
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
                return { mayors, nextButton: nextButton ? nextButton.getAttribute('href') : null };
            }, mayors);
            mayors = scrapedData.mayors;
            let nextPage = scrapedData.nextButton;
            if (nextPage) {
                return scrapMayorInfoFromRegionLink(browser, nextPage, mayors);
            }
            else {
                return mayors;
            }
        }
        catch (e) {
            console.log('Error getting mayors from', regionLink);
            console.log(e);
            return mayors;
        }
        finally {
            yield page.close();
        }
    });
}
function getMayorInfo(browser, mayor) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Getting mayor info from', mayor.cityHallUrl);
        const page = yield browser.newPage();
        try {
            yield page.goto(mayor.cityHallUrl);
            return yield page.evaluate((mayor) => {
                const pElement = document.querySelectorAll('p');
                const matchDate = pElement[1].textContent.match(/pris ses fonctions en tant que maire le (\d{2}\/\d{2}\/\d{4})/);
                mayor.date = matchDate ? matchDate[1] : '';
                const phoneElement = document.querySelector('span[itemprop="telephone"]');
                mayor.phoneNumber = phoneElement.textContent;
                const emailElement = document.querySelector('span[itemprop="email"]');
                mayor.email = emailElement.textContent;
                const addressElement = document.querySelector('span[itemprop="address"]');
                mayor.address = addressElement.textContent.replace(/\s{2,}/g, ' ').trim(); //remove extra spaces
                return mayor;
            }, mayor);
        }
        catch (e) {
            console.log('Error getting mayor info from', mayor.cityHallUrl);
            console.log(e);
            return mayor;
        }
        finally {
            yield page.close();
        }
    });
}
function extractMayorData() {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch();
        try {
            const regionLinks = yield getRegionLinks();
            const mayors = [];
            for (const regionLink of regionLinks) {
                const regionMayors = yield scrapMayorInfoFromRegionLink(browser, regionLink);
                for (const mayor of regionMayors) {
                    const mayorInfo = yield getMayorInfo(browser, mayor);
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
            fs.writeFileSync('mayors.csv', `Région,Ville,Nom du maire,Date de prise de fonction,Téléphone,Email,Adresse mairie,URL\n${csvData}`, 'utf-8');
        }
        catch (e) {
            console.log(e);
        }
        finally {
            console.log('Done');
            yield browser.close();
            process.exit(0);
        }
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield extractMayorData();
}))();
//# sourceMappingURL=scraper.js.map