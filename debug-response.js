const axios = require('axios');
const fs = require('fs');

async function debugTikTokResponse() {
  // Load cookies
  const cookieData = fs.readFileSync('./cookies.json', 'utf8');
  const cookies = JSON.parse(cookieData);
  
  const cookieHeader = cookies
    .filter(cookie => {
      if (!cookie.expirationDate) return true;
      const now = Date.now() / 1000;
      return cookie.expirationDate > now;
    })
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const url = `https://www.tiktok.com/api/post/item_list/?aid=1988&app_language=en&app_name=tiktok_web&battery_info=1&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0%20%28Windows%20NT%2010.0%3B%20Win64%3B%20x64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F107.0.0.0%20Safari%2F537.36%20Edg%2F107.0.1418.35&channel=tiktok_web&cookie_enabled=true&device_id=7002566096994190854&device_platform=web_pc&focus_state=false&from_page=user&history_len=3&is_fullscreen=false&is_page_visible=true&os=windows&priority_region=RO&referer=https%3A%2F%2Fexportcomments.com%2F&region=RO&root_referer=https%3A%2F%2Fexportcomments.com%2F&screen_height=1440&screen_width=2560&tz_name=Europe%2FBucharest&verifyFp=verify_lacphy8d_z2ux9idt_xdmu_4gKb_9nng_NNTTTvsFS8ao&webcast_language=en&msToken=3eV3yAQ6HjKVN2lTb1653VD5jP0dG-UC-w5vCs1vHIvpQnWjG4ePrzbF6bfauIMPA_5Fpy5T0EUelJYqf8i-ZWnhA38V1I27VjC4eT4MkLsystELbSaZCPc2M-kTmrOpYD6rLnVM8xljh7NIDwza5yRBXA==&X-Bogus=DFSzswVL-XGANHVWS0OnS2XyYJUm`;

  const headers = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.35",
    "x-tt-params": "hE4u0e5rW4whKotS4HK1Bep9xDC6lUqRFVbJnZOHVBQWg0lkocWxB+jGY6QmT50NbqDNHIKxx228w5zuDVnno8Fgvk",
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "sec-ch-ua": '"Chromium";v="107", "Microsoft Edge";v="107", "Not=A?Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "referer": "https://www.tiktok.com/",
    "cookie": cookieHeader
  };

  try {
    console.log('🔍 Making raw request to TikTok API...');
    const response = await axios.get(url, { headers });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Content-Type: ${response.headers['content-type']}`);
    console.log(`📏 Content-Length: ${response.headers['content-length']}`);
    console.log(`🍪 Set-Cookie: ${response.headers['set-cookie'] || 'None'}`);
    
    console.log('\n📋 Raw Response Data:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(response.data, null, 2));
    console.log('='.repeat(50));
    
    // Save to file for analysis
    fs.writeFileSync('raw-response.json', JSON.stringify({
      status: response.status,
      headers: response.headers,
      data: response.data
    }, null, 2));
    
    console.log('\n💾 Full response saved to raw-response.json');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`📱 Status: ${error.response.status}`);
      console.error(`📋 Data:`, error.response.data);
    }
  }
}

debugTikTokResponse(); 