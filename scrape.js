import fs from "fs";
import { Cluster } from "puppeteer-cluster";

const urls = [
  "https://www.willowdalenissan.com/used/s/age/o/asc",
  "https://www.infinitiofwillowdale.com/used/s/age/o/asc",
];

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
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 1,
    monitor: true,
    puppeteerOptions: {
      headless: false,
      defaultViewport: false,
      userDataDir: "./tmp",
    },
  });

  cluster.on("taskerror", (err, data) => {
    console.log(`Error crawling ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url);

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

  });

  for (const url of urls) {
    await cluster.queue(url);
  }

  await cluster.idle();
  await cluster.close();
})();
