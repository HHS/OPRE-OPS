import puppeteer from "puppeteer";

jest.setTimeout(15000);

describe("OPS", () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            //executablePath: "/usr/bin/google-chrome",
            headless: true,
            args: ["--disable-gpu", "--disable-dev-shm-usage", "--disable-setuid-sandbox", "--no-sandbox"],
        });
        page = await browser.newPage();
    });

    describe("/", () => {
        it("Contains the welcome header", async () => {
            await page.goto("http://localhost:3000/");
            await page.waitForSelector("#title-box");
            const text = await page.$eval("#title-box", (e) => e.textContent);
            expect(text).toContain("This is the OPRE");
        });
    });

    describe("/cans", () => {
        // it("CANS List link navigation", async () => {
        //     await page.goto("http://localhost:3000/cans");
        //     await page.waitForSelector("#can-list");
        //     await page.click("#lnkCans");
        //     const text = await page.$eval("#can-list", (e) => e.textContent);
        //     expect(text).toContain("List of all CANs");
        // });

        it("CANS List direct navigation", async () => {
            await page.goto("http://localhost:3000/cans");
            await page.waitForSelector("#can-list");
            const text = await page.$eval("#can-list", (e) => e.textContent);
            expect(text).toContain("List of all CANs");
        });
    });

    afterAll(() => browser.close());
});
