// For more information, see https://crawlee.dev/
import { promisify } from 'util';
import { PlaywrightCrawler, downloadListOfUrls } from "crawlee";
import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";
import { Page } from "playwright";
import { isWithinTokenLimit } from "gpt-tokenizer";
import { PathLike } from "fs";
import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { Config, configSchema } from "./config_validation";
import { aws_config } from '../uploadToS3';

// import * as https from 'https';
// import * as fs from 'fs';
import * as path from 'path';

let pageCounter = 0;
let crawler: PlaywrightCrawler;

// Upload PDF to S3 and send the S3 path to the ingest function
async function uploadPdfToS3(url: string, courseName: string) {
  console.log(`Uploading PDF to S3: ${url}`);
  const filename = path.basename(url);
  const s3Client = new S3Client({
    region: aws_config.region,
    credentials: {
      accessKeyId: aws_config.accessKeyId as string,
      secretAccessKey: aws_config.secretAccessKey as string,
    },
  });
  const s3BucketName = aws_config.bucketName;
  const s3Key = `courses/${courseName}/${filename}`;

  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const pdfBuffer = response.data;

  await s3Client.send(new PutObjectCommand({
    Bucket: s3BucketName,
    Key: s3Key,
    Body: pdfBuffer,
  }));

  console.log(`PDF uploaded to S3 at key: ${s3Key}`);
  return s3Key;
}

// TODO: don't await ingest, makes things too slow.

async function ingestPdf(s3Key: string, courseName: string) {
  const ingestEndpoint = 'https://flask-production-751b.up.railway.app/ingest';
  const readableFilename = path.basename(s3Key);
  try {
    const response = await axios.get(ingestEndpoint, {
      params: {
        course_name: courseName,
        s3_paths: s3Key,
        readable_filename: readableFilename,
      },
    });
    console.log(`PDF ingested: ${response.data}`);
  } catch (error) {
    console.error(`Error ingesting PDF: ${error}`);
  }
}

async function handlePdf(url: string, courseName: string) {
  const s3Key = await uploadPdfToS3(url, courseName);
  await ingestPdf(s3Key, courseName);
}

export function getPageHtml(page: Page, selector = "body") {
  return page.evaluate((selector) => {
    console.log(`Getting page HTML...`);
    // Exclude header, footer, nav from scraping
    const elementsToExclude = document.querySelectorAll('header, footer, nav');
    elementsToExclude.forEach(element => element.remove());
    // Check if the selector is an XPath
    if (selector.startsWith("/")) {
      console.log(`XPath: ${selector}`);
      const elements = document.evaluate(
        selector,
        document,
        null,
        XPathResult.ANY_TYPE,
        null,
      );
      const result = elements.iterateNext();
      return result ? result.textContent || "" : "";
    } else {
      // Handle as a CSS selector
      console.log(`Selector: ${selector}`);
      const el = document.querySelector(selector) as HTMLElement | null;
      return el?.innerText || "";
    }
  }, selector);
}

export async function waitForXPath(page: Page, xpath: string, timeout: number) {
  await page.waitForFunction(
    (xpath) => {
      const elements = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ANY_TYPE,
        null,
      );
      return elements.iterateNext() !== null;
    },
    xpath,
    { timeout },
  );
}

export async function crawl(config: Config) {
  configSchema.parse(config);

  // All results stored here!
  const results: Array<{ title: string; url: string; html: string }> = [];


  if (config.url) {
    if (config.url.endsWith('.pdf')) {
      console.log(`Found a PDF: ${config.url}`);
      await handlePdf(config.url, config.courseName);
    }
    else {
      console.log(`Crawling URL: ${config.url}`);
      if (process.env.NO_CRAWL !== "true") {
        // PlaywrightCrawler crawls the web using a headless
        // browser controlled by the Playwright library.
        crawler = new PlaywrightCrawler({
          // Use the requestHandler to process each of the crawled pages.
          async requestHandler({ request, page, enqueueLinks, log, pushData }) {
            const title = await page.title();
            pageCounter++;
            log.info(
              `Crawling: Page ${pageCounter} / ${config.maxPagesToCrawl} - URL: ${request.loadedUrl}...`,
            );

            // Use custom handling for XPath selector
            if (config.selector) {
              if (config.selector.startsWith("/")) {
                await waitForXPath(
                  page,
                  config.selector,
                  config.waitForSelectorTimeout ?? 1000,
                );
              } else {
                await page.waitForSelector(config.selector, {
                  timeout: config.waitForSelectorTimeout ?? 1000,
                });
              }
            }
            page.on('console', message => console.log(`Page log: ${message.text()}`));
            const html = await getPageHtml(page, config.selector);
            //console.log(html);

            // Save results as JSON to ./storage/datasets/default
            // await pushData({ title, url: request.loadedUrl, html });

            // Instead of pushing data to a file, add it to the results array
            if (request.loadedUrl) {
              results.push({ title, url: request.loadedUrl, html });
            } else {
              console.error('Error: URL is undefined. Title is: ', title);
            }


            if (config.onVisitPage) {
              await config.onVisitPage({ page, pushData });
            }

            // Extract links from the current page
            // and add them to the crawling queue.
            await enqueueLinks({
              globs:
                typeof config.match === "string" ? [config.match] : config.match,
              transformRequestFunction(req) {
                // ignore all links ending with `.pdf`
                if (req.url.endsWith('.pdf')) {
                  console.log(`Downloading PDF: ${req.url}`);
                  handlePdf(req.url, config.courseName);
                  return false;
                }
                return req;
              },
              exclude:
                typeof config.exclude === "string"
                  ? [config.exclude]
                  : config.exclude ?? [],
            });
          },
          // Comment this option to scrape the full website.
          maxRequestsPerCrawl: config.maxPagesToCrawl,
          // Uncomment this option to see the browser window.
          // headless: false,
          preNavigationHooks: [
            // Abort requests for certain resource types
            async ({ request, page, log }) => {
              // If there are no resource exclusions, return
              const RESOURCE_EXCLUSTIONS = config.resourceExclusions ?? [];
              if (RESOURCE_EXCLUSTIONS.length === 0) {
                return;
              }
              if (config.cookie) {
                const cookies = (
                  Array.isArray(config.cookie) ? config.cookie : [config.cookie]
                ).map((cookie) => {
                  return {
                    name: cookie.name,
                    value: cookie.value,
                    url: request.loadedUrl,
                  };
                });
                await page.context().addCookies(cookies);
              }
              await page.route(`**\/*.{${RESOURCE_EXCLUSTIONS.join()}}`, (route) =>
                route.abort("aborted"),
              );
              log.info(
                `Aborting requests for as this is a resource excluded route`,
              );
            },
          ],
        });

        const isUrlASitemap = /sitemap.*\.xml$/.test(config.url);

        if (isUrlASitemap) {
          const listOfUrls = await downloadListOfUrls({ url: config.url });

          // Add the initial URL to the crawling queue.
          await crawler.addRequests(listOfUrls);

          // Run the crawler
          await crawler.run();
        } else {
          // Add first URL to the queue and start the crawl.
          await crawler.run([config.url]);
        }
      }
    }
  }
  return results; // Return the collected results
}

// export async function write(config: Config) {
//   let nextFileNameString: PathLike = "";
//   const globPromise = promisify(glob);

//   // const jsonFiles = await glob("storage/datasets/default/*.json", {
//   //   absolute: true,
//   // });
//   const jsonFiles = await globPromise("storage/datasets/default/*.json", {
//     absolute: true,
//   });

//   console.log(`Found ${jsonFiles.length} files to combine...`);

//   let currentResults: Record<string, any>[] = [];
//   let currentSize: number = 0;
//   let fileCounter: number = 1;
//   const maxBytes: number = config.maxFileSize
//     ? config.maxFileSize * 1024 * 1024
//     : Infinity;

//   const getStringByteSize = (str: string): number =>
//     Buffer.byteLength(str, "utf-8");

//   const nextFileName = (): string =>
//     `${config.outputFileName.replace(/\.json$/, "")}-${fileCounter}.json`;

//   const writeBatchToFile = async (): Promise<void> => {
//     nextFileNameString = nextFileName();
//     await writeFile(
//       nextFileNameString,
//       JSON.stringify(currentResults, null, 2),
//     );
//     console.log(
//       `Wrote ${currentResults.length} items to ${nextFileNameString}`,
//     );
//     currentResults = [];
//     currentSize = 0;
//     fileCounter++;
//   };

//   let estimatedTokens: number = 0;

//   const addContentOrSplit = async (
//     data: Record<string, any>,
//   ): Promise<void> => {
//     const contentString: string = JSON.stringify(data);
//     const tokenCount: number | false = isWithinTokenLimit(
//       contentString,
//       config.maxTokens || Infinity,
//     );

//     if (typeof tokenCount === "number") {
//       if (estimatedTokens + tokenCount > config.maxTokens!) {
//         // Only write the batch if it's not empty (something to write)
//         if (currentResults.length > 0) {
//           await writeBatchToFile();
//         }
//         // Since the addition of a single item exceeded the token limit, halve it.
//         estimatedTokens = Math.floor(tokenCount / 2);
//         currentResults.push(data);
//       } else {
//         currentResults.push(data);
//         estimatedTokens += tokenCount;
//       }
//     }

//     currentSize += getStringByteSize(contentString);
//     if (currentSize > maxBytes) {
//       await writeBatchToFile();
//     }
//   };

//   // Iterate over each JSON file and process its contents.
//   for (const file of jsonFiles) {
//     const fileContent = await readFile(file, "utf-8");
//     const data: Record<string, any> = JSON.parse(fileContent);
//     await addContentOrSplit(data);
//   }

//   // Check if any remaining data needs to be written to a file.
//   if (currentResults.length > 0) {
//     await writeBatchToFile();
//   }

//   return nextFileNameString;
// }

class GPTCrawlerCore {
  config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async crawl() {
    await crawl(this.config);
  }

  // async write(): Promise<PathLike> {
  //   // we need to wait for the file path as the path can change
  //   return new Promise((resolve, reject) => {
  //     write(this.config)
  //       .then((outputFilePath) => {
  //         resolve(outputFilePath);
  //       })
  //       .catch(reject);
  //   });
  // }
}

export default GPTCrawlerCore;
