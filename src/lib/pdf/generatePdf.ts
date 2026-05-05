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
    // Vercel serverless — use @sparticuz/chromium-min (binario descargado desde URL)
    // El paquete chromium regular falla en Vercel por archivos brotli faltantes (commit 2d5a32e).
    // chromium-min descarga el tarball en runtime desde GitHub releases.
    const chromium = (await import('@sparticuz/chromium-min')).default;
    // Deshabilita stack de gráficos/WebGL — no lo necesitamos para PDFs y reduce tiempo de arranque
    chromium.setGraphicsMode = false;
    executablePath = await chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v135.0.0/chromium-v135.0.0-pack.tar'
    );
    args = chromium.args;
    headless = true;
  } else {
    // Local dev — use system Chrome
    executablePath = getLocalChromePath();
    args = ['--no-sandbox', '--disable-setuid-sandbox'];
    headless = true;
  }

  const launchStart = Date.now();
  const browser = await puppeteer.launch({
    executablePath,
    args,
    headless,
    defaultViewport: { width: 794, height: 1123 }, // A4-ish
    timeout: 30_000,
  });
  console.log('[generatePdf] Chromium launched', { ms: Date.now() - launchStart });

  try {
    const page = await browser.newPage();
    // Bloquear recursos externos (imagenes externas, fonts) para evitar que
    // networkidle se cuelgue. El logo de Fonneta ya viene como base64 inline.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      // Permitir solo data: URIs y about:blank (todo el HTML es self-contained)
      if (url.startsWith('data:') || url === 'about:blank' || url.startsWith('file://')) {
        req.continue();
      } else {
        req.abort();
      }
    });

    // 'load' es suficiente para HTML self-contained. Evita el wait de 500ms de networkidle0.
    const setContentStart = Date.now();
    await page.setContent(html, { waitUntil: 'load', timeout: 20_000 });
    console.log('[generatePdf] Content set', { ms: Date.now() - setContentStart });

    const pdfStart = Date.now();
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      timeout: 20_000,
    });
    console.log('[generatePdf] PDF rendered', { ms: Date.now() - pdfStart, size: pdfBuffer.length });

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
