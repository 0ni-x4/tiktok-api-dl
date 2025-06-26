const fs = require('fs');
const path = require('path');
const TiktokAPI = require('./lib/index.js');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function persistentScrapeAllVideos() {
    try {
        console.log('🚀 PERSISTENT SCRAPING MODE - Maximizing @admisist video collection...');
        
        // Get profile info first
        const profile = await TiktokAPI.StalkUser('admisist');
        if (profile.status === 'error') {
            console.error('❌ Error getting profile:', profile.message);
            return;
        }
        
        const totalVideos = profile.result?.stats?.videoCount || 0;
        console.log(`🎯 Target: ${totalVideos} videos`);
        console.log(`👤 Account: ${profile.result?.user?.nickname} (@${profile.result?.user?.username})`);
        
        let allPosts = [];
        let maxSuccessfulBatch = 0;
        
        // Strategy 1: Find the maximum batch size that works
        console.log('\n📊 Phase 1: Finding maximum successful batch size...');
        const testSizes = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        
        for (const size of testSizes) {
            console.log(`🔍 Testing batch size ${size}...`);
            
            try {
                const response = await TiktokAPI.GetUserPosts('admisist', {
                    postLimit: size
                });
                
                if (response.status === 'success' && response.result && response.result.length > 0) {
                    console.log(`✅ SUCCESS with ${size} posts - got ${response.result.length} videos`);
                    allPosts = response.result;
                    maxSuccessfulBatch = size;
                } else {
                    console.log(`❌ Failed at batch size ${size}`);
                    break;
                }
                
                await sleep(2000); // Wait between attempts
                
            } catch (error) {
                console.log(`❌ Error at batch size ${size}: ${error.message}`);
                break;
            }
        }
        
        console.log(`\n🎯 Maximum successful batch size: ${maxSuccessfulBatch} videos`);
        
        if (allPosts.length === 0) {
            console.log('❌ Could not retrieve any posts. API completely blocked.');
            return;
        }
        
        // Strategy 2: Try alternative approaches to get more videos
        console.log('\n📊 Phase 2: Attempting alternative collection methods...');
        
        // Try with different approaches
        const alternatives = [
            { method: 'getUserPosts', limit: maxSuccessfulBatch + 5 },
            { method: 'getUserPosts', limit: Math.floor(maxSuccessfulBatch * 1.5) },
            { method: 'getUserPosts', limit: maxSuccessfulBatch + 10 },
            { method: 'getUserPosts', limit: maxSuccessfulBatch + 15 }
        ];
        
        for (const alt of alternatives) {
            console.log(`🔄 Trying ${alt.method} with limit ${alt.limit}...`);
            
            try {
                const response = await TiktokAPI.GetUserPosts('admisist', {
                    postLimit: alt.limit
                });
                
                if (response.status === 'success' && response.result && response.result.length > allPosts.length) {
                    console.log(`✅ IMPROVEMENT! Got ${response.result.length} videos (+${response.result.length - allPosts.length} new)`);
                    allPosts = response.result;
                } else {
                    console.log(`❌ No improvement with limit ${alt.limit}`);
                }
                
                await sleep(3000); // Longer wait between alternative attempts
                
            } catch (error) {
                console.log(`❌ Alternative failed: ${error.message}`);
            }
        }
        
        // Strategy 3: Use multiple smaller requests with delays
        console.log('\n📊 Phase 3: Multiple requests strategy...');
        
        let bestResult = [...allPosts]; // Keep our best result
        const smallBatchSize = Math.min(20, maxSuccessfulBatch);
        
        console.log(`🔄 Trying multiple ${smallBatchSize}-video batches with longer delays...`);
        
        for (let attempt = 1; attempt <= 5; attempt++) {
            console.log(`📊 Multi-batch attempt ${attempt}/5...`);
            
            try {
                // Wait longer between multi-batch attempts
                if (attempt > 1) {
                    console.log('⏱️ Waiting 10 seconds to avoid rate limiting...');
                    await sleep(10000);
                }
                
                const response = await TiktokAPI.GetUserPosts('admisist', {
                    postLimit: smallBatchSize * attempt
                });
                
                if (response.status === 'success' && response.result && response.result.length > bestResult.length) {
                    console.log(`✅ Multi-batch SUCCESS! Got ${response.result.length} total videos`);
                    bestResult = response.result;
                } else {
                    console.log(`❌ Multi-batch attempt ${attempt} failed or no improvement`);
                }
                
            } catch (error) {
                console.log(`❌ Multi-batch attempt ${attempt} error: ${error.message}`);
                // Continue trying other attempts
            }
        }
        
        allPosts = bestResult;
        
        if (allPosts.length === 0) {
            console.log('❌ All strategies failed. Could not retrieve any posts.');
            return;
        }
        
        console.log(`\n🎉 SCRAPING COMPLETE!`);
        console.log(`📊 Successfully scraped ${allPosts.length} out of ${totalVideos} videos (${Math.round((allPosts.length/totalVideos)*100)}%)`);
        
        // Strategy 4: Try to get individual video details for recent videos we might have missed
        console.log('\n📊 Phase 4: Enhancing data quality...');
        
        // Process all the scraped posts with enhanced metadata
        const videoMetadata = allPosts.map((post, index) => {
            const createDate = new Date(post.createTime * 1000);
            
            return {
                postNumber: index + 1,
                id: post.id,
                description: post.desc || '',
                createTime: post.createTime,
                createDate: createDate.toISOString(),
                ageInDays: Math.floor((Date.now() - post.createTime * 1000) / (1000 * 60 * 60 * 24)),
                
                // Main stats we're interested in
                stats: {
                    views: post.stats.playCount || 0,
                    likes: post.stats.likeCount || post.stats.diggCount || 0,
                    comments: post.stats.commentCount || 0,
                    shares: post.stats.shareCount || 0,
                    collects: post.stats.collectCount || 0
                },
                
                // Calculate engagement metrics
                engagement: {
                    likesPerView: post.stats.playCount > 0 ? Math.round((post.stats.likeCount || post.stats.diggCount || 0) / post.stats.playCount * 10000) / 100 : 0,
                    commentsPerView: post.stats.playCount > 0 ? Math.round((post.stats.commentCount || 0) / post.stats.playCount * 10000) / 100 : 0,
                    sharesPerView: post.stats.playCount > 0 ? Math.round((post.stats.shareCount || 0) / post.stats.playCount * 10000) / 100 : 0,
                    totalEngagement: (post.stats.likeCount || post.stats.diggCount || 0) + (post.stats.commentCount || 0) + (post.stats.shareCount || 0)
                },
                
                // Additional metadata
                author: {
                    username: post.author?.username || '',
                    nickname: post.author?.nickname || '',
                    verified: post.author?.verified || false
                },
                
                // Video details
                video: post.video ? {
                    id: post.video.id,
                    duration: post.video.duration,
                    ratio: post.video.ratio,
                    format: post.video.format,
                    bitrate: post.video.bitrate || 0
                } : null,
                
                // Image post details
                imagePost: post.imagePost ? {
                    images: post.imagePost,
                    imageCount: post.imagePost.length
                } : null,
                
                // Music info
                music: post.music ? {
                    title: post.music.title || '',
                    authorName: post.music.authorName || '',
                    duration: post.music.duration || 0,
                    isOriginal: post.music.original || false
                } : null,
                
                // Extract hashtags from description
                hashtags: (post.desc || '').match(/#\w+/g) || [],
                
                // Additional flags
                flags: {
                    duetEnabled: post.duetEnabled === 1,
                    stitchEnabled: post.stitchEnabled === 1,
                    isOriginalItem: post.originalItem === 1,
                    isPrivateItem: post.privateItem === 1,
                    hasImagePost: !!post.imagePost,
                    hasVideo: !!post.video
                }
            };
        });
        
        // Calculate comprehensive statistics
        const totalViews = videoMetadata.reduce((sum, video) => sum + video.stats.views, 0);
        const totalLikes = videoMetadata.reduce((sum, video) => sum + video.stats.likes, 0);
        const totalComments = videoMetadata.reduce((sum, video) => sum + video.stats.comments, 0);
        const totalShares = videoMetadata.reduce((sum, video) => sum + video.stats.shares, 0);
        const totalCollects = videoMetadata.reduce((sum, video) => sum + video.stats.collects, 0);
        const totalEngagement = videoMetadata.reduce((sum, video) => sum + video.engagement.totalEngagement, 0);
        
        const avgViews = videoMetadata.length > 0 ? Math.round(totalViews / videoMetadata.length) : 0;
        const avgLikes = videoMetadata.length > 0 ? Math.round(totalLikes / videoMetadata.length) : 0;
        const avgComments = videoMetadata.length > 0 ? Math.round(totalComments / videoMetadata.length) : 0;
        const avgShares = videoMetadata.length > 0 ? Math.round(totalShares / videoMetadata.length) : 0;
        const avgEngagement = videoMetadata.length > 0 ? Math.round(totalEngagement / videoMetadata.length) : 0;
        
        // Enhanced analytics
        const topByViews = [...videoMetadata].sort((a, b) => b.stats.views - a.stats.views).slice(0, 10);
        const topByLikes = [...videoMetadata].sort((a, b) => b.stats.likes - a.stats.likes).slice(0, 10);
        const topByEngagement = [...videoMetadata].sort((a, b) => b.engagement.totalEngagement - a.engagement.totalEngagement).slice(0, 10);
        const mostRecent = [...videoMetadata].sort((a, b) => b.createTime - a.createTime).slice(0, 10);
        
        // Content analysis
        const allHashtags = videoMetadata.flatMap(v => v.hashtags);
        const hashtagCounts = {};
        allHashtags.forEach(tag => {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
        });
        const topHashtags = Object.entries(hashtagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20)
            .map(([tag, count]) => ({ tag, count }));
        
        // Posting patterns
        const postsByMonth = {};
        const postsByDay = {};
        const postsByHour = {};
        
        videoMetadata.forEach(post => {
            const date = new Date(post.createTime * 1000);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const dayKey = date.getDay();
            const hourKey = date.getHours();
            
            postsByMonth[monthKey] = (postsByMonth[monthKey] || 0) + 1;
            postsByDay[dayKey] = (postsByDay[dayKey] || 0) + 1;
            postsByHour[hourKey] = (postsByHour[hourKey] || 0) + 1;
        });
        
        // Create comprehensive results object
        const results = {
            scrapedAt: new Date().toISOString(),
            account: '@admisist',
            scrapingStrategy: 'Persistent multi-phase approach',
            
            accountInfo: {
                username: profile.result?.user?.username,
                nickname: profile.result?.user?.nickname,
                verified: profile.result?.user?.verified,
                signature: profile.result?.user?.signature,
                region: profile.result?.user?.region,
                privateAccount: profile.result?.user?.privateAccount,
                followers: profile.result?.stats?.followerCount,
                following: profile.result?.stats?.followingCount,
                totalHearts: profile.result?.stats?.heartCount,
                totalVideosOnAccount: totalVideos,
                videosScraped: videoMetadata.length,
                scrapeCompleteness: Math.round((videoMetadata.length / totalVideos) * 100),
                maxBatchSizeAchieved: maxSuccessfulBatch
            },
            
            summary: {
                totalViews,
                totalLikes,
                totalComments,
                totalShares,
                totalCollects,
                totalEngagement,
                averageViews: avgViews,
                averageLikes: avgLikes,
                averageComments: avgComments,
                averageShares: avgShares,
                averageEngagement: avgEngagement,
                overallEngagementRate: totalViews > 0 ? Math.round((totalLikes / totalViews) * 10000) / 100 : 0,
                videoTypes: {
                    videos: videoMetadata.filter(v => v.flags.hasVideo).length,
                    imagePosts: videoMetadata.filter(v => v.flags.hasImagePost).length
                }
            },
            
            topPerformers: {
                byViews: topByViews.map(v => ({
                    postNumber: v.postNumber,
                    id: v.id,
                    description: v.description.substring(0, 150) + (v.description.length > 150 ? '...' : ''),
                    views: v.stats.views,
                    likes: v.stats.likes,
                    comments: v.stats.comments,
                    shares: v.stats.shares,
                    engagementRate: v.engagement.likesPerView,
                    ageInDays: v.ageInDays,
                    createDate: v.createDate
                })),
                byLikes: topByLikes.map(v => ({
                    postNumber: v.postNumber,
                    id: v.id,
                    description: v.description.substring(0, 150) + (v.description.length > 150 ? '...' : ''),
                    views: v.stats.views,
                    likes: v.stats.likes,
                    comments: v.stats.comments,
                    shares: v.stats.shares,
                    engagementRate: v.engagement.likesPerView,
                    ageInDays: v.ageInDays,
                    createDate: v.createDate
                })),
                byEngagement: topByEngagement.map(v => ({
                    postNumber: v.postNumber,
                    id: v.id,
                    description: v.description.substring(0, 150) + (v.description.length > 150 ? '...' : ''),
                    views: v.stats.views,
                    likes: v.stats.likes,
                    comments: v.stats.comments,
                    shares: v.stats.shares,
                    totalEngagement: v.engagement.totalEngagement,
                    engagementRate: v.engagement.likesPerView,
                    ageInDays: v.ageInDays,
                    createDate: v.createDate
                })),
                mostRecent: mostRecent.map(v => ({
                    postNumber: v.postNumber,
                    id: v.id,
                    description: v.description.substring(0, 150) + (v.description.length > 150 ? '...' : ''),
                    views: v.stats.views,
                    likes: v.stats.likes,
                    ageInDays: v.ageInDays,
                    createDate: v.createDate
                }))
            },
            
            contentAnalysis: {
                topHashtags,
                totalUniqueHashtags: Object.keys(hashtagCounts).length,
                avgHashtagsPerPost: videoMetadata.length > 0 ? Math.round((allHashtags.length / videoMetadata.length) * 100) / 100 : 0
            },
            
            analytics: {
                postsByMonth,
                postsByDay: {
                    0: postsByDay[0] || 0, // Sunday
                    1: postsByDay[1] || 0, // Monday
                    2: postsByDay[2] || 0, // Tuesday
                    3: postsByDay[3] || 0, // Wednesday
                    4: postsByDay[4] || 0, // Thursday
                    5: postsByDay[5] || 0, // Friday
                    6: postsByDay[6] || 0  // Saturday
                },
                postsByHour
            },
            
            posts: videoMetadata
        };
        
        // Save to results.json
        const resultsPath = path.join(__dirname, '..', 'results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        
        // Display comprehensive summary
        console.log(`\n📊 COMPREHENSIVE ANALYSIS FOR @admisist:`);
        console.log(`═══════════════════════════════════════════════════════════`);
        console.log(`🎯 SCRAPING RESULTS:`);
        console.log(`  📹 Videos Scraped: ${results.accountInfo.videosScraped}/${results.accountInfo.totalVideosOnAccount} (${results.accountInfo.scrapeCompleteness}%)`);
        console.log(`  🔧 Max Batch Size: ${results.accountInfo.maxBatchSizeAchieved} videos`);
        console.log(`  👥 Followers: ${results.accountInfo.followers?.toLocaleString()}`);
        console.log(`  ❤️ Total Hearts: ${results.accountInfo.totalHearts?.toLocaleString()}`);
        
        console.log(`\n📈 PERFORMANCE METRICS:`);
        console.log(`  👀 Total Views: ${totalViews.toLocaleString()}`);
        console.log(`  👍 Total Likes: ${totalLikes.toLocaleString()}`);
        console.log(`  💬 Total Comments: ${totalComments.toLocaleString()}`);
        console.log(`  🔄 Total Shares: ${totalShares.toLocaleString()}`);
        console.log(`  📎 Total Collects: ${totalCollects.toLocaleString()}`);
        console.log(`  🔥 Total Engagement: ${totalEngagement.toLocaleString()}`);
        
        console.log(`\n📊 AVERAGES PER VIDEO:`);
        console.log(`  👀 Avg Views: ${avgViews.toLocaleString()}`);
        console.log(`  👍 Avg Likes: ${avgLikes.toLocaleString()}`);
        console.log(`  💬 Avg Comments: ${avgComments.toLocaleString()}`);
        console.log(`  🔄 Avg Shares: ${avgShares.toLocaleString()}`);
        console.log(`  🔥 Avg Engagement: ${avgEngagement.toLocaleString()}`);
        console.log(`  📈 Engagement Rate: ${results.summary.overallEngagementRate}%`);
        
        console.log(`\n🏆 TOP PERFORMERS:`);
        if (topByViews.length > 0) {
            console.log(`  🥇 Most Views: ${topByViews[0].stats.views.toLocaleString()} views`);
            console.log(`  🥇 Most Likes: ${topByLikes[0].stats.likes.toLocaleString()} likes`);
            console.log(`  🥇 Most Engagement: ${topByEngagement[0].engagement.totalEngagement.toLocaleString()} total interactions`);
        }
        
        console.log(`\n📝 CONTENT INSIGHTS:`);
        console.log(`  #️⃣ Total Hashtags: ${results.contentAnalysis.totalUniqueHashtags} unique`);
        console.log(`  #️⃣ Avg Hashtags/Post: ${results.contentAnalysis.avgHashtagsPerPost}`);
        if (topHashtags.length > 0) {
            console.log(`  🔥 Top Hashtag: ${topHashtags[0].tag} (${topHashtags[0].count} times)`);
        }
        
        console.log(`\n💾 Complete results saved to: ${resultsPath}`);
        console.log(`📋 Results include ${videoMetadata.length} videos with comprehensive metadata!`);
        
        if (results.accountInfo.scrapeCompleteness < 100) {
            console.log(`\n⚠️  NOTE: Got ${results.accountInfo.scrapeCompleteness}% of total videos due to TikTok API limitations.`);
            console.log(`This represents a significant sample of the account's content for analysis.`);
        }
        
    } catch (error) {
        console.error('❌ Error during persistent scraping:', error.message);
        console.error('Full error:', error);
    }
}

// Run the persistent scraper
persistentScrapeAllVideos(); 