const puppeteer = require('puppeteer');

async function scrapeFromUrls(urls) {
    const browser = await puppeteer.launch();
    const results = {};

    for (const url of urls) {
        try {
            const page = await browser.newPage();
            await page.goto(url);

            // Wait for the target element to load
            const targetElement = await page.waitForSelector('h1.title');
            const targetText = await targetElement.textContent();

            // Find and collect additional elements
            const additionalElements = await page.$$('p.content');
            const additionalTexts = await additionalElements.map(el => el.textContent());

            // Store the results
            results[url] = {
                targetText,
                additionalTexts
            };
        } catch (error) {
            console.error(`Error processing ${url}: ${error.message}`);
            results[url] = {
                targetText: '',
                additionalTexts: []
            };
        }
    }

    await browser.close();
    return results;
}

// Example usage:
const urls = ['https://example.com/page1', 'https://example.com/page2'];
const result = await scrapeFromUrls(urls);

console.log(result);