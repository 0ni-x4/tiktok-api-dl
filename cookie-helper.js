const fs = require('fs');

class CookieHelper {
  constructor(cookieFilePath = './cookies.json') {
    this.cookieFilePath = cookieFilePath;
    this.cookies = [];
    this.loadCookies();
  }

  loadCookies() {
    try {
      const cookieData = fs.readFileSync(this.cookieFilePath, 'utf8');
      this.cookies = JSON.parse(cookieData);
      console.log(`✅ Loaded ${this.cookies.length} cookies from ${this.cookieFilePath}`);
    } catch (error) {
      console.error(`❌ Failed to load cookies: ${error.message}`);
      this.cookies = [];
    }
  }

  // Convert cookies to HTTP Cookie header format
  getCookieHeader() {
    return this.cookies
      .filter(cookie => !this.isExpired(cookie))
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
  }

  // Check if cookie is expired
  isExpired(cookie) {
    if (!cookie.expirationDate) return false;
    const now = Date.now() / 1000; // Convert to seconds
    return cookie.expirationDate < now;
  }

  // Get specific cookie value by name
  getCookieValue(name) {
    const cookie = this.cookies.find(c => c.name === name && !this.isExpired(c));
    return cookie ? cookie.value : null;
  }

  // Get critical TikTok cookies
  getCriticalCookies() {
    return {
      sessionid: this.getCookieValue('sessionid'),
      sid_tt: this.getCookieValue('sid_tt'),
      msToken: this.getCookieValue('msToken'),
      ttwid: this.getCookieValue('ttwid'),
      uid_tt: this.getCookieValue('uid_tt'),
      tt_csrf_token: this.getCookieValue('tt_csrf_token'),
      tt_chain_token: this.getCookieValue('tt_chain_token')
    };
  }

  // Display cookie status
  displayStatus() {
    const critical = this.getCriticalCookies();
    console.log('\n🍪 Cookie Status:');
    Object.entries(critical).forEach(([name, value]) => {
      const status = value ? '✅' : '❌';
      const display = value ? `${value.substring(0, 20)}...` : 'NOT FOUND';
      console.log(`${status} ${name}: ${display}`);
    });
    
    const expired = this.cookies.filter(c => this.isExpired(c));
    if (expired.length > 0) {
      console.log(`\n⚠️  ${expired.length} cookies are expired`);
    }
  }
}

module.exports = CookieHelper;

// Test if run directly
if (require.main === module) {
  const helper = new CookieHelper();
  helper.displayStatus();
  console.log('\n📋 Full Cookie Header:');
  console.log(helper.getCookieHeader());
} 