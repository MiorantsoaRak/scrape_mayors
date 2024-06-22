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
const scrapeFunctions_1 = require("./scrapeFunctions");
function extractMayorData() {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch();
        try {
            const regionLinks = yield (0, scrapeFunctions_1.getRegionLinks)();
            const mayors = [];
            for (const regionLink of regionLinks) {
                const regionMayors = yield (0, scrapeFunctions_1.scrapMayorInfoFromRegionLink)(browser, regionLink);
                for (const mayor of regionMayors) {
                    const mayorInfo = yield (0, scrapeFunctions_1.completeMayorInfo)(browser, mayor);
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
function createCsvFile(csvData, fileName = 'mayors.csv') {
    fs.writeFileSync(fileName, csvData);
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield extractMayorData();
}))();
//# sourceMappingURL=scraper.js.map