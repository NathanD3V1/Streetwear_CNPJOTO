const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.static('.'));

const server = app.listen(5500, async () => {
    try {
        console.log("Server listening on 5500");
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log('PAGE LOG:', msg.type(), msg.text());
        });
        
        page.on('pageerror', err => {
            console.log('PAGE ERROR:', err.message);
        });
        
        await page.goto('http://127.0.0.1:5500/index.html', { waitUntil: 'networkidle0' });
        
        // Let's also check if the content rendered
        const hero = await page.$('.hero');
        if (hero) {
            console.log("Hero rendered successfully.");
        } else {
            console.log("Hero is missing!");
        }
        
        await browser.close();
    } catch (e) {
        console.error("Puppeteer error:", e);
    } finally {
        server.close();
    }
});
