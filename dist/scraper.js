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
let mayors = [];
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
        mayor = yield page.evaluate((mayor) => {
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
    });
}
function getMayorInfo(mayor) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.goto(mayor.cityHallUrl);
        return yield page.evaluate((mayor) => {
            const pElement = document.querySelector('p');
            const matchDate = pElement.textContent.match(/pris ses fonctions en tant que maire le (\d{2}\/\d{2}\/\d{4})/);
            mayor.date = matchDate ? matchDate[0] : '';
            const phoneElement = document.querySelector('span[itemprop="telephone"]');
            mayor.phoneNumber = phoneElement.textContent;
            const emailElement = document.querySelector('span[itemprop="email"]');
            mayor.email = emailElement.textContent;
            return mayor;
        }, mayor);
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield init();
    const regionLinks = yield getRegionLinks();
    const mayorWithLinks = [];
    const mayors = [];
    for (const regionLink of regionLinks) {
        const cityLink = yield getCityLink(regionLink);
        mayorWithLinks.push(cityLink);
    }
    for (const mayor of mayorWithLinks) {
        const mayorInfo = yield getMayorInfo(mayor);
        mayors.push(mayorInfo);
    }
    console.log(mayors);
    yield browser.close();
}))();
//# sourceMappingURL=scraper.js.map