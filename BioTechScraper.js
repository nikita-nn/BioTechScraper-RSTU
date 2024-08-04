import { chromium } from "playwright";
import * as fs from "fs";
import readline from 'readline';


const parseManagerName = async (projectNumber, outputStream) => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`https://rscf.ru/project/${projectNumber}/`);

    const is404 = await page.evaluate(() => {
        return !!document.querySelector('.b404-h2');
    });

    if (is404) {
        outputStream.write(`${projectNumber}, 404\n`);
        await browser.close();
        return;
    }

    await page.waitForSelector("span.fld_title");

    const managerName = await page.evaluate(() => {
        const titleElements = document.querySelectorAll('span.fld_title');
        if (titleElements.length >= 3) {
            const titleElement = titleElements[2];
            const nextNode = titleElement.nextSibling;
            if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
                return nextNode.textContent.trim().replace(/\s+/g, ' ');
            }
        }
        return null;
    });

    if (managerName) {
        outputStream.write(`${projectNumber}, ${managerName}\n`);
    }

    await browser.close();
};

// Функция для подсчета строк в файле
const countLinesInFile = async (filePath) => {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineCount = 0;
    for await (const line of rl) {
        lineCount++;
    }
    return lineCount;
};

const main = async () => {
    const inputFilePath = "./input.txt";
    const outputFilePath = "./output.txt";

    const totalLines = await countLinesInFile(inputFilePath);

    const fileStream = fs.createReadStream(inputFilePath);
    const outputStream = fs.createWriteStream(outputFilePath, { flags: 'a' });

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let processedLines = 0;

    for await (const line of rl) {
        await parseManagerName(line, outputStream);
        processedLines++;

        const progressPercentage = ((processedLines / totalLines) * 100).toFixed(2);
        process.stdout.write(`Progress: ${progressPercentage}%\r`);
    }

    outputStream.end();
    console.log('\nProcessing complete.');
};

main().catch(console.error);
