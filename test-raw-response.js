const axios = require('axios');
const fs = require('fs');

async function testRawResponse() {
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

  // The exact URL from our successful request
  const secUid = 'MS4wLjABAAAAU6Lojg_JaGEwN980v9EmKrXm9f9LZE7w5Bg40ssNjhLaZGXbRVK1fAI-c6T-SJHg';
  const url = `https://www.tiktok.com/api/post/item_list/?aid=1988&app_language=en&app_name=tiktok_web&battery_info=1&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0%20%28Windows%20NT%2010.0%3B%20Win64%3B%20x64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F107.0.0.0%20Safari%2F537.36%20Edg%2F107.0.1418.35&channel=tiktok_web&cookie_enabled=true&device_id=7002566096994190854&device_platform=web_pc&focus_state=false&from_page=user&history_len=3&is_fullscreen=false&is_page_visible=true&os=windows&priority_region=RO&referer=https%3A%2F%2Fexportcomments.com%2F&region=RO&root_referer=https%3A%2F%2Fexportcomments.com%2F&screen_height=1440&screen_width=2560&tz_name=Europe%2FBucharest&verifyFp=verify_lacphy8d_z2ux9idt_xdmu_4gKb_9nng_NNTTTvsFS8ao&webcast_language=en&secUid=${secUid}&cursor=0&count=35&msToken=3eV3yAQ6HjKVN2lTb1653VD5jP0dG-UC-w5vCs1vHIvpQnWjG4ePrzbF6bfauIMPA_5Fpy5T0EUelJYqf8i-ZWnhA38V1I27VjC4eT4MkLsystELbSaZCPc2M-kTmrOpYD6rLnVM8xljh7NIDwza5yRBXA==&X-Bogus=DFSzswVL-XGANHVWS0OnS2XyYJUm`;

  console.log('🧪 Testing TikTok API response...');
  console.log('🔗 URL:', url);
  console.log('');

  try {
    const response = await axios.get(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.35',
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'sec-ch-ua': '\"Chromium\";v=\"107\", \"Microsoft Edge\";v=\"107\", \"Not=A?Brand\";v=\"24\"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '\"Windows\"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'referer': 'https://www.tiktok.com/',
        'cookie': cookieHeader
      }
    });

    console.log('✅ Response Status:', response.status);
    console.log('📊 Response Size:', JSON.stringify(response.data).length, 'bytes');
    console.log('📋 Response Headers:', response.headers);
    console.log('');
    console.log('📄 Raw Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    // Save to file
    fs.writeFileSync('raw-response-debug.json', JSON.stringify({
      status: response.status,
      headers: response.headers,
      data: response.data
    }, null, 2));

    console.log('💾 Response saved to raw-response-debug.json');

    // Test if the response has any useful data structure
    if (response.data && typeof response.data === 'object') {
      console.log('🔍 Response data type: object');
      console.log('🗝️ Response keys:', Object.keys(response.data));
    } else {
      console.log('🔍 Response data type:', typeof response.data);
      console.log('📝 Response content:', response.data);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    if (error.response) {
      console.log('📱 Error Response Status:', error.response.status);
      console.log('📋 Error Response Headers:', error.response.headers);
      console.log('📄 Error Response Data:', error.response.data);
    }
  }
}

testRawResponse();