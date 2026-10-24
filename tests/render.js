// out/*.html を PDF と確認用 PNG にする
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const dir = path.join(__dirname, 'out');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort()) {
    await page.goto('file://' + path.join(dir, f));
    await page.pdf({ path: path.join(dir, f.replace('.html', '.pdf')), format: 'A4', printBackground: true });
    if (process.argv[2] === 'png') await page.screenshot({ path: path.join(dir, f.replace('.html', '.png')), fullPage: true });
  }
  await browser.close();
})();
