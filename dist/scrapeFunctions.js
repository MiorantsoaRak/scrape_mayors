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
exports.getRegionLinks = getRegionLinks;
exports.scrapMayorInfoFromRegionLink = scrapMayorInfoFromRegionLink;
exports.completeMayorInfo = completeMayorInfo;
const puppeteer_1 = require("puppeteer");
/**
 * Function to get all region links from the website.
 * @returns {Promise<string[]>} A promise that resolves to an array of region links.
 */
function getRegionLinks() {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch();
        const page = yield browser.newPage();
        yield page.goto("https://www.mon-maire.fr/maires-regions");
        return yield page.evaluate(() => Array.from(document.querySelectorAll(".list-group a"))
            .map((link) => link.getAttribute('href')));
    });
}
/**
 * Function to scrape mayor information from a given region link.
 * @param {Browser} browser - Puppeteer browser instance.
 * @param {string} regionLink - The link of the region to scrape.
 * @param {Mayor[]} mayors - An array of Mayor objects to populate with scraped data.
 * @returns {Promise<Mayor[]>} A promise that resolves to an array of Mayor objects.
 */
function scrapMayorInfoFromRegionLink(browser_1, regionLink_1) {
    return __awaiter(this, arguments, void 0, function* (browser, regionLink, mayors = []) {
        let hasNextPage = true;
        console.log('Getting mayors from', regionLink);
        const currentPage = yield browser.newPage();
        try {
            yield currentPage.goto(regionLink);
            const scrapedData = yield currentPage.evaluate((mayors) => {
                const mayorLinks = document.querySelectorAll(".list-group-item a");
                const element = document.querySelectorAll(".list-group-item");
                const titleElement = document.querySelector('h1.post-title');
                const nextButton = document.querySelector('.pagination-wrapper .next.page-numbers');
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
            yield currentPage.close();
        }
    });
}
/**
 * Function to complete information for a given Mayor object.
 * @param {Browser} browser - Puppeteer browser instance.
 * @param {Mayor} mayor - The Mayor object to complete.
 * @returns {Promise<Mayor>} A promise that resolves to a completed Mayor object.
 */
function completeMayorInfo(browser, mayor) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Getting mayor info from', mayor.cityHallUrl);
        const page = yield browser.newPage();
        try {
            yield page.goto(mayor.cityHallUrl, { timeout: 60000 });
            return yield page.evaluate((mayor) => {
                const pElement = document.querySelectorAll('p');
                const matchDate = pElement[1].textContent.match(/pris ses fonctions en tant que maire le (\d{2}\/\d{2}\/\d{4})/);
                mayor.date = matchDate ? matchDate[1] : '';
                const phoneElement = document.querySelector('span[itemprop="telephone"]');
                mayor.phoneNumber = phoneElement ? phoneElement.textContent : '';
                const emailElement = document.querySelector('span[itemprop="email"]');
                mayor.email = emailElement ? emailElement.textContent : '';
                const addressElement = document.querySelector('span[itemprop="address"]');
                mayor.address = addressElement ? addressElement.textContent.replace(/\s{2,}/g, ' ').trim() : ''; //remove extra spaces
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
//# sourceMappingURL=scrapeFunctions.js.map