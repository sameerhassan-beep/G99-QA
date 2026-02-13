const puppeteer = require('puppeteer');

let browser;

const getBrowser = async () => {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        browser.on('disconnected', () => {
            browser = null;
        });
    }
    return browser;
};

exports.captureScreenshot = async (req, res) => {
    const { url, fullPage = 'true', width, height, isMobile = 'false', device = 'desktop' } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let page;
    try {
        const browserInstance = await getBrowser();
        page = await browserInstance.newPage();
        
        // Device specific configuration
        let viewportWidth = parseInt(width);
        let viewportHeight = parseInt(height);
        let userAgent = '';

        if (device === 'mobile' || isMobile === 'true') {
            viewportWidth = viewportWidth || 375;
            viewportHeight = viewportHeight || 667;
            userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
            await page.setUserAgent(userAgent);
            await page.setViewport({ 
                width: viewportWidth, 
                height: viewportHeight,
                isMobile: true,
                hasTouch: true,
                deviceScaleFactor: 2
            });
        } else if (device === 'tablet') {
            viewportWidth = viewportWidth || 768;
            viewportHeight = viewportHeight || 1024;
            userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
            await page.setUserAgent(userAgent);
            await page.setViewport({ 
                width: viewportWidth, 
                height: viewportHeight,
                isMobile: true,
                hasTouch: true,
                deviceScaleFactor: 2
            });
        } else {
            // Default Desktop
            viewportWidth = viewportWidth || 1440;
            viewportHeight = viewportHeight || 900;
            await page.setViewport({ 
                width: viewportWidth, 
                height: viewportHeight 
            });
        }
        
        // Navigate to the URL
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        
        // Wait for potential lazy-loaded content and handle sticky headers
        await page.evaluate(async () => {
            // Scroll to bottom to trigger lazy loading
            await new Promise((resolve) => {
                let totalHeight = 0;
                let distance = 100;
                let timer = setInterval(() => {
                    let scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if(totalHeight >= scrollHeight){
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });

            // Scroll back to top
            window.scrollTo(0, 0);

            // Wait a bit for things to settle
            await new Promise(r => setTimeout(r, 500));

            // Fix sticky/fixed headers for full page screenshot
            const elements = document.querySelectorAll('*');
            for (const el of elements) {
                const style = window.getComputedStyle(el);
                if (style.position === 'fixed' || style.position === 'sticky') {
                    // Only change if it's at the top of the viewport/page
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 0) {
                        el.style.position = 'absolute';
                        el.style.top = '0px';
                    } else {
                        // Hide other fixed elements (like chat widgets, "scroll to top" buttons)
                        // as they often clutter full-page screenshots
                        el.style.display = 'none';
                    }
                }
            }
        });

        // Take a screenshot
        const screenshot = await page.screenshot({
            type: 'jpeg',
            quality: 70,
            fullPage: fullPage === 'true'
        });

        await page.close();

        // Send the screenshot as a base64 string or binary
        res.set('Content-Type', 'image/jpeg');
        res.send(screenshot);
    } catch (error) {
        if (page) await page.close();
        console.error('Screenshot error:', error);
        res.status(500).json({ error: 'Failed to capture screenshot', details: error.message });
    }
};
