import puppeteer from 'puppeteer-core';

/**
 * Generates a PDF buffer from an HTML string using puppeteer-core.
 * On Vercel (AWS Lambda) uses @sparticuz/chromium.
 * On local dev uses the system Chrome installation.
 */
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const isProduction = process.env.NODE_ENV === 'production';

  let executablePath: string;
  let args: string[];
  let headless: boolean | 'shell' = true;

  if (isProduction) {
    // Vercel serverless — use @sparticuz/chromium
    const chromium = (await import('@sparticuz/chromium')).default;
    executablePath = await chromium.executablePath();
    args = chromium.args;
    headless = 'shell';
  } else {
    // Local dev — use system Chrome
    executablePath = getLocalChromePath();
    args = ['--no-sandbox', '--disable-setuid-sandbox'];
    headless = true;
  }

  const browser = await puppeteer.launch({
    executablePath,
    args,
    headless,
    defaultViewport: { width: 794, height: 1123 }, // A4-ish
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function getLocalChromePath(): string {
  const platform = process.platform;
  if (platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }
  if (platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  // Linux
  return '/usr/bin/google-chrome';
}
