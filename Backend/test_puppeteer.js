const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({
            headless: true, // Try classic headless
            dumpio: true,   // Show browser stdout/stderr
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('Browser launched. Creating new page...');
        const page = await browser.newPage();
        console.log('Navigating to example.com...');
        await page.goto('https://example.com');
        console.log('Taking screenshot...');
        await page.screenshot({ path: 'test_example.png' });
        console.log('Screenshot taken successfully.');
        await browser.close();
        console.log('Browser closed.');
    } catch (error) {
        console.error('Puppeteer Test Error:', error);
        process.exit(1);
    }
})();
