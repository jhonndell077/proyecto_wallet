const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const htmlPath = path.join(__dirname, 'GUIA_MIGRACION_INCOME_WALLET.html');
  const pdfPath = path.join(__dirname, 'GUIA_MIGRACION_INCOME_WALLET.pdf');

  console.log('Generando PDF...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Cargar el archivo HTML
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  // Generar PDF
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });

  await browser.close();

  console.log(`PDF generado exitosamente: ${pdfPath}`);
})().catch(console.error);