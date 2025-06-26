const { chromium } = require('playwright');
const fs = require('fs');

class StealthTikTokScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.cookies = [];
  }

  async loadCookies() {
    try {
      const cookieData = fs.readFileSync('./cookies.json', 'utf8');
      this.cookies = JSON.parse(cookieData);
      console.log(`🍪 Loaded ${this.cookies.length} cookies`);
    } catch (error) {
      console.error('❌ Failed to load cookies:', error.message);
    }
  }

  async init(headless = false) {
    await this.loadCookies();
    
    this.browser = await chromium.launch({
      headless,
      devtools: !headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
      ]
    });

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });

    this.page = await context.newPage();
    
    // Set up stealth measures
    await this.page.addInitScript(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    // Add cookies to context
    if (this.cookies.length > 0) {
      const playwrightCookies = this.cookies.map(cookie => {
        let sameSite = 'Lax';
        if (cookie.sameSite === 'no_restriction') sameSite = 'None';
        else if (cookie.sameSite === 'lax') sameSite = 'Lax';
        else if (cookie.sameSite === 'strict') sameSite = 'Strict';
        else if (!cookie.sameSite) sameSite = 'Lax';
        
        return {
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain,
          path: cookie.path,
          expires: cookie.expirationDate ? cookie.expirationDate : undefined,
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: sameSite
        };
      });
      
      await context.addCookies(playwrightCookies);
      console.log('🔐 Added authenticated cookies to browser context');
    }

    // Set up network monitoring
    this.page.on('request', request => {
      if (request.url().includes('api/post/item_list')) {
        console.log(`🌐 API REQUEST: ${request.url()}`);
        console.log(`📋 Headers:`, request.headers());
      }
    });

    this.page.on('response', response => {
      if (response.url().includes('api/post/item_list')) {
        console.log(`✅ API RESPONSE: ${response.status()} - ${response.url()}`);
      }
    });
  }

  async scrapeUserPosts(username, maxPosts = 10) {
    console.log(`🎯 Scraping posts from @${username}...`);
    
    try {
      // Navigate to user profile
      await this.page.goto(`https://www.tiktok.com/@${username}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      console.log('⏳ Waiting for page to load...');
      await this.page.waitForTimeout(3000);

      // Wait for video elements to load
      try {
        await this.page.waitForSelector('[data-e2e="user-post-item"]', { timeout: 10000 });
        console.log('✅ Video elements found!');
      } catch (error) {
        console.log('⚠️ No video elements found, checking for other indicators...');
      }

      // Take screenshot for debugging
      await this.page.screenshot({ path: `debug-${username}.png`, fullPage: true });
      console.log(`📸 Screenshot saved: debug-${username}.png`);

      // Extract video data
      const videos = await this.page.evaluate(() => {
        const videoElements = document.querySelectorAll('[data-e2e="user-post-item"]');
        const videos = [];
        
        videoElements.forEach((element, index) => {
          try {
            const link = element.querySelector('a');
            const video = element.querySelector('video');
            const description = element.querySelector('[data-e2e="user-post-item-desc"]');
            
            if (link) {
              videos.push({
                url: link.href,
                videoUrl: video ? video.src : null,
                description: description ? description.textContent.trim() : '',
                index: index + 1
              });
            }
          } catch (error) {
            console.log(`Error extracting video ${index}:`, error);
          }
        });
        
        return videos;
      });

      console.log(`🎬 Found ${videos.length} videos`);
      
      if (videos.length === 0) {
        // Try alternative selectors
        const alternativeVideos = await this.page.evaluate(() => {
          const containers = document.querySelectorAll('[data-e2e="user-post-item-list"] > div');
          const videos = [];
          
          containers.forEach((container, index) => {
            const link = container.querySelector('a[href*="/video/"]');
            if (link) {
              videos.push({
                url: link.href,
                index: index + 1,
                method: 'alternative'
              });
            }
          });
          
          return videos;
        });
        
        console.log(`🔍 Alternative method found ${alternativeVideos.length} videos`);
        return alternativeVideos.slice(0, maxPosts);
      }

      return videos.slice(0, maxPosts);
      
    } catch (error) {
      console.error('❌ Error during scraping:', error.message);
      
      // Take error screenshot
      await this.page.screenshot({ path: `error-${username}.png`, fullPage: true });
      console.log(`📸 Error screenshot saved: error-${username}.png`);
      
      return [];
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Test function
async function testScraper() {
  const scraper = new StealthTikTokScraper();
  
  try {
    console.log('🚀 Initializing stealth scraper...');
    await scraper.init(false); // Set to true for headless mode
    
    console.log('📱 Scraping @admisist posts...');
    const videos = await scraper.scrapeUserPosts('admisist', 5);
    
    console.log('\n🎬 Results:');
    videos.forEach(video => {
      console.log(`${video.index}. ${video.url}`);
      if (video.description) console.log(`   Description: ${video.description}`);
    });
    
    if (videos.length > 0) {
      fs.writeFileSync('scraped-videos.json', JSON.stringify(videos, null, 2));
      console.log('\n💾 Results saved to scraped-videos.json');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await scraper.close();
  }
}

module.exports = StealthTikTokScraper;

// Run test if called directly
if (require.main === module) {
  testScraper();
} 