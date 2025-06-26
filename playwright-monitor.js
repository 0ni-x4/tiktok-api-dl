const { chromium } = require('playwright');

class TikTokPlaywrightMonitor {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init(headless = false) {
    this.browser = await chromium.launch({ 
      headless,
      devtools: !headless // Open DevTools when headed
    });
    this.page = await this.browser.newPage();
    
    // Set up network monitoring
    this.page.on('request', request => {
      console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
      console.log(`📋 Headers:`, request.headers());
    });
    
    this.page.on('response', response => {
      console.log(`✅ RESPONSE: ${response.status()} ${response.url()}`);
    });
    
    // Set realistic user agent and viewport
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
    });
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async getUserPosts(username, limit = 30) {
    try {
      console.log(`🎯 Navigating to @${username}'s profile...`);
      await this.page.goto(`https://www.tiktok.com/@${username}`, { 
        waitUntil: 'networkidle' 
      });

      // Wait for the page to load
      await this.page.waitForSelector('[data-e2e="user-post-item"]', { timeout: 10000 });

      const posts = [];
      let scrollAttempts = 0;
      const maxScrollAttempts = 20;

      while (posts.length < limit && scrollAttempts < maxScrollAttempts) {
        // Get current posts
        const currentPosts = await this.page.evaluate(() => {
          const postElements = document.querySelectorAll('[data-e2e="user-post-item"]');
          return Array.from(postElements).map(el => {
            const link = el.querySelector('a');
            const img = el.querySelector('img');
            return {
              url: link ? link.href : null,
              thumbnail: img ? img.src : null,
              id: link ? link.href.split('/').pop() : null
            };
          });
        });

        // Add new posts
        for (const post of currentPosts) {
          if (!posts.find(p => p.id === post.id) && posts.length < limit) {
            posts.push(post);
          }
        }

        console.log(`📊 Found ${posts.length} posts so far...`);

        // Scroll down to load more
        await this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        // Wait for new content to load
        await this.page.waitForTimeout(2000);
        scrollAttempts++;
      }

      console.log(`✅ Collected ${posts.length} posts`);
      return { status: 'success', result: posts.slice(0, limit) };

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Usage example
async function monitorTikTokScraping() {
  const monitor = new TikTokPlaywrightMonitor();
  
  try {
    // Set to false for headless mode, true to see the browser
    await monitor.init(true); // HEADED MODE - you can see what's happening!
    
    const result = await monitor.getUserPosts('admisist', 10);
    console.log('Final result:', result);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await monitor.close();
  }
}

module.exports = { TikTokPlaywrightMonitor, monitorTikTokScraping };

// Run if called directly
if (require.main === module) {
  monitorTikTokScraping();
} 