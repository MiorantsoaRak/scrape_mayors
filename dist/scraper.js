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
let browser;
let page;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        browser = yield puppeteer_1.default.launch();
        page = yield browser.newPage();
    });
}
function getRegionLinks() {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.goto("https://www.mon-maire.fr/maires-regions");
        return yield page.evaluate(() => Array.from(document.querySelectorAll(".list-group a"))
            .map((link) => link.getAttribute('href')));
    });
}
function getCityLink(regionLink) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.goto(regionLink);
        let mayors = [];
        mayors = yield page.evaluate((mayors) => {
            const mayorLinks = document.querySelectorAll(".list-group-item a");
            const element = document.querySelectorAll(".list-group-item");
            const titleElement = document.querySelector('h1.post-title');
            const region = titleElement.textContent
                .replace('Maires ', '')
                .replace('région ', '');
            for (let i = 0; i < mayorLinks.length; i++) {
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
            return mayors;
        }, mayors);
        return mayors;
    });
}
function getMayorInfo(mayor) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield init();
    const regionLinks = yield getRegionLinks();
    const mayorWithLinks = [];
    const mayors = [];
    //for (const regionLink of regionLinks) {
    const cityLink = yield getCityLink(regionLinks[0]);
    mayorWithLinks.push(...cityLink);
    //}
    for (const mayor of mayorWithLinks) {
        const mayorInfo = yield getMayorInfo(mayorWithLinks[3]);
        mayors.push(mayorInfo);
    }
    console.log(mayors);
    yield browser.close();
}))();
//# sourceMappingURL=scraper.js.map