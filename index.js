import fs from "fs";

import puppeteer from "puppeteer";

// A function to scroll all the way down to the bottom of the screen to load all the vehicles in the DOM
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
        defaultViewport: false,
    });

    // Open a new page
    const page = await browser.newPage();

    // On this new page:
    // - open the "https://www.willowdalenissan.com/used/s/age/o/asc" website
    // - wait until the dom content is loaded (HTML is ready)
    await page.goto("https://www.willowdalenissan.com/used/s/age/o/asc", {
        waitUntil: "domcontentloaded",
    });

    //load all the vehicles by scrolling to the bottom of he page
    await autoScroll(page);

    // let's just call them vehicleHandle 
    const vehicleHandles = await page.$$('.vehicle-list-cell.listing-page-row-padding-0');
    
    const LOCATION = "7200 Yonge";
    let items = [];

    // loop thru all handles
    for (const vehiclehandle of vehicleHandles) {
        let yearMakeModel = "Null"
        let image = "Null"
        let vin = "Null"

        try {
            // pass the single handle below
            yearMakeModel = await page.evaluate(el => el.querySelector(".vehicle-year-make-model > .stat-text-link").innerText, vehiclehandle)
        } catch (error) {}
        try {
            image = await page.evaluate(el => el.querySelector(".img-list-respnsive.stat-image-link").getAttribute("src"), vehiclehandle)
        } catch (error) {}
        try {
            vin = await page.evaluate(el => el.querySelector("div > div:nth-child(1) > div > table > tbody > tr:nth-child(4) > td.table-col-1").innerText, vehiclehandle)
        } catch (error) {}
            // do whatever you want with the data
        if (yearMakeModel !== "Null"){
            items.push({yearMakeModel, image, vin, LOCATION});
            fs.appendFile('vehicles.csv', 
                `${yearMakeModel},${image},${vin},${LOCATION},<img src="https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${vin}&style=197&type=C128B&width=271&height=50&xres=1&font=3" />\n`, 
                function (err) {
                    if (err) throw err;
                }
            );
        }
    }
    console.log(items.length)
    // Close the browser
    await browser.close();

})();