import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Francois.Gaborel\\.gemini\\antigravity\\brain\\a68bf6fb-509d-4c3a-b249-fe8f34e5057d';

const viewports = [
  { name: 'mobile_iphone', width: 390, height: 844, isMobile: true },
  { name: 'tablet_ipad', width: 768, height: 1024, isMobile: true },
  { name: 'desktop_mac', width: 1280, height: 800, isMobile: false },
];

async function runQATests() {
  console.log('--- Starting Automated Browser QA Tests ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const report = [];

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });

    // 1. Initial Page Load
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));

    const initialScreenPath = path.join(ARTIFACT_DIR, `qa_${vp.name}_initial.png`);
    await page.screenshot({ path: initialScreenPath });
    console.log(`Saved screenshot: ${initialScreenPath}`);

    // Check Map & Right Controls
    const mushroomBtn = await page.$('button[aria-label="Spotter un coin à champignons"]');
    const hasMushroomBtn = Boolean(mushroomBtn);
    console.log(`Mushroom button found: ${hasMushroomBtn}`);

    // 2. Click Mushroom Spotting Mode
    let spottingModeActive = false;
    let bannerOverlaps = false;
    if (mushroomBtn) {
      await mushroomBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      const bannerText = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent?.includes('Mode Repérage Champignons'));
        return el ? el.textContent : null;
      });
      spottingModeActive = Boolean(bannerText);

      // Verify that the bottom dock "Explorer les circuits" is hidden during spotting mode
      const explorerDockVisible = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent?.includes('Explorer les circuits'));
        return el ? window.getComputedStyle(el).display !== 'none' : false;
      });

      console.log(`Spotting banner active: ${spottingModeActive}`);
      console.log(`Explorer dock hidden during spotting: ${!explorerDockVisible}`);

      const spottingScreenPath = path.join(ARTIFACT_DIR, `qa_${vp.name}_spotting.png`);
      await page.screenshot({ path: spottingScreenPath });

      // Exit spotting mode
      await page.evaluate(() => {
        const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Annuler'));
        if (cancelBtn) cancelBtn.click();
      });
      await new Promise((r) => setTimeout(r, 500));
    }

    // 3. Open Favorites Modal & Test Tabs
    // Find Favorites button in top left or right
    await page.evaluate(() => {
      const favBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.getAttribute('aria-label')?.includes('favoris') ||
        b.getAttribute('title')?.includes('favoris') ||
        b.getAttribute('title')?.includes('Carnet')
      );
      if (favBtn) favBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const favModalScreenPath = path.join(ARTIFACT_DIR, `qa_${vp.name}_favorites.png`);
    await page.screenshot({ path: favModalScreenPath });

    // Evaluate Favorites UI state:
    const favModalAnalysis = await page.evaluate(() => {
      const modal = document.querySelector('h2');
      const hasModal = modal ? modal.textContent?.includes('Bibliothèque') : false;
      const tabs = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean);
      const hasOldFunnel1 = tabs.some(t => t.includes('1. Traces à faire'));
      const hasOldFunnel2 = tabs.some(t => t.includes('2. Traces notées'));
      const hasUnifiedTracksTab = tabs.some(t => t.includes('Mes circuits enregistrés'));
      const hasSyncTab = tabs.some(t => t.includes('Synchronisation Cloud') || t.includes('Synchro & QR'));
      return { hasModal, hasOldFunnel1, hasOldFunnel2, hasUnifiedTracksTab, hasSyncTab };
    });
    console.log('Favorites Modal Analysis:', favModalAnalysis);

    // Switch to Sync Tab
    await page.evaluate(() => {
      const syncBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Synchronisation') || b.textContent?.includes('Synchro & QR')
      );
      if (syncBtn) syncBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const syncScreenPath = path.join(ARTIFACT_DIR, `qa_${vp.name}_sync_tab.png`);
    await page.screenshot({ path: syncScreenPath });

    // Close modal
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-x') || b.querySelector('svg.lucide-close'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    report.push({
      viewport: vp.name,
      dimensions: `${vp.width}x${vp.height}`,
      hasMushroomBtn,
      spottingModeActive,
      favModalAnalysis,
    });

    await page.close();
  }

  await browser.close();
  console.log('\n--- QA Report Summary ---');
  console.log(JSON.stringify(report, null, 2));
}

runQATests().catch(err => {
  console.error('QA Test Error:', err);
  process.exit(1);
});
