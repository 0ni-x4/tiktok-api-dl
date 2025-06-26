const { StalkUser } = require('./lib/utils/get/getProfile');
const { getUserPosts } = require('./lib/utils/get/getUserPosts');

async function comprehensiveDebug() {
  const username = 'admisist';
  
  try {
    console.log(`🔍 Step 1: Getting profile for @${username}...`);
    const profile = await StalkUser(username);
    
    console.log('✅ Profile response received');
    console.log('📋 Full profile object:', JSON.stringify(profile, null, 2));
    
    if (!profile || typeof profile !== 'object') {
      console.log('❌ Invalid profile response!');
      return;
    }
    
    // Extract actual profile data (structure might be nested)
    const userData = profile.result?.user || profile.user || profile.userInfo?.user || profile;
    
    console.log('\n🔍 User data found:');
    console.log(`  - Username: ${userData.username || userData.uniqueId}`);
    console.log(`  - Nickname: ${userData.nickname}`);
    console.log(`  - SecUid: ${userData.secUid || 'NOT FOUND'}`);
    console.log(`  - ID: ${userData.id || 'NOT FOUND'}`);
    
    if (!userData.secUid) {
      console.log('❌ No secUid found in profile, this might be the issue!');
      return;
    }
    
    console.log(`\n🎬 Step 2: Fetching posts for secUid: ${userData.secUid}...`);
    const posts = await getUserPosts(username, 5);
    
    console.log(`✅ Successfully fetched ${posts.length} posts`);
    if (posts.length > 0) {
      console.log('🎥 Sample post:', {
        id: posts[0].id,
        desc: posts[0].desc?.substring(0, 100) + '...',
        stats: posts[0].stats
      });
    } else {
      console.log('⚠️ No posts returned despite user having videos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📋 Stack:', error.stack);
  }
}

comprehensiveDebug(); 