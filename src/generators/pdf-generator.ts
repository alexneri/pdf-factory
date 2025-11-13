import { Buffer } from 'node:buffer';

import puppeteer, { type Browser } from 'puppeteer';

import type { PdfGenerationOptions } from '../types';

export class PdfGenerator {
  private browser?: Browser;
  private readonly launchOptions: Record<string, unknown>;

  constructor(launchOptions: Record<string, unknown> = {}) {
    this.launchOptions = launchOptions;
  }

  async generate(html: string, options: PdfGenerationOptions): Promise<Buffer> {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    const pdfData = await page.pdf(options);
    await page.close();
    return Buffer.from(pdfData);
  }

  async close(): Promise<void> {
    if (!this.browser) {
      return;
    }

    await this.browser.close();
    this.browser = undefined;
  }

  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'shell',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...this.launchOptions,
      });
    }

    return this.browser;
  }
}

