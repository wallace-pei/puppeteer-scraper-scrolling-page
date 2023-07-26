import puppeteer from "puppeteer";

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

(async () => {
    // Start a Puppeteer session with:
    // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
    // - no default viewport (`defaultViewport: null` - website page will in full width and height)
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false
    });

    // Open a new page
    const page = await browser.newPage();

    // On this new page:
    // - open the "https://www.willowdalenissan.com/used/s/age/o/asc" website
    // - wait until the dom content is loaded (HTML is ready)
    await page.goto("https://www.willowdalenissan.com/used/s/age/o/asc", {
        waitUntil: "load",
    });

    await autoScroll(page);

    //await browser.close();

})();