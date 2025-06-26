const { chromium } = require('playwright');

async function simpleTest() {
  const browser = await chromium.launch({ 
    headless: false,  // HEADED MODE - you can see the browser!
    devtools: true    // Opens DevTools automatically
  });
  
  const page = await browser.newPage();
  
  // Monitor network requests
  page.on('request', request => {
    console.log(`📤 ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    console.log(`📥 ${response.status()} ${response.url()}`);
  });
  
  try {
    console.log('🚀 Opening TikTok profile...');
    await page.goto('https://www.tiktok.com/@admisist');
    
    // Wait longer and take a screenshot
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tiktok-page.png' });
    console.log('📸 Screenshot saved as tiktok-page.png');
    
    // Keep browser open for 30 seconds so you can inspect
    console.log('🔍 Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
simpleTest(); 