const puppeteer = require('puppeteer');

async function scrapeMultipleUrls(urls, selectors) {
    // Initialize the browser and a new page
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const results = [];

    for (const url of urls) {
        await page.goto(url, { waitUntil: 'networkidle0' });

        const pageData = {
            url: url,
            data: {}
        };

        for (const [elementName, selector] of Object.entries(selectors)) {
            try {
                // Wait for the element to be available
                await page.waitForSelector(selector, { timeout: 5000 });

                // Extract the text content
                const text = await page.$eval(selector, element => element.textContent);

                pageData.data[elementName] = text.trim();
            } catch (error) {
                console.error(`Element '${selector}' not found on ${url}`);
                pageData.data[elementName] = 'Element not found';
            }
        }

        results.push(pageData);
    }

    await browser.close();
    return results;
}

// Example usage
const urls = [
    'https://example.com/page1',
    'https://example.com/page2'
];

const selectors = {
    'title': 'title',
    'header': 'h1',
    'mainContent': '#main-content'
};

scrapeMultipleUrls(urls, selectors)
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));