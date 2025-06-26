const fs = require('fs');
const path = require('path');
const TiktokAPI = require('./lib/index.js');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function aggressiveScrapeAllVideos() {
    try {
        console.log('🚀 AGGRESSIVE SCRAPING MODE - Getting ALL @admisist videos...');
        
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
        let attempts = 0;
        const maxAttempts = 10;
        
        // Strategy 1: Try increasingly larger batch sizes
        const batchSizes = [10, 20, 30, 50, 75, 100, 150, 200, 300, 544];
        
        for (const batchSize of batchSizes) {
            attempts++;
            console.log(`\n📊 Attempt ${attempts}/${maxAttempts}: Trying batch size ${batchSize}...`);
            
            try {
                const response = await TiktokAPI.GetUserPosts('admisist', {
                    postLimit: batchSize
                });
                
                if (response.status === 'success' && response.result && response.result.length > 0) {
                    console.log(`✅ SUCCESS! Got ${response.result.length} posts with batch size ${batchSize}`);
                    
                    if (response.result.length > allPosts.length) {
                        allPosts = response.result;
                        console.log(`🔄 Updated collection: now have ${allPosts.length} posts`);
                    }
                    
                    // If we got all videos, break
                    if (allPosts.length >= totalVideos) {
                        console.log(`🎉 GOT ALL VIDEOS! ${allPosts.length}/${totalVideos}`);
                        break;
                    }
                } else {
                    console.log(`❌ Failed with batch size ${batchSize}: ${response.message || 'Unknown error'}`);
                }
                
            } catch (error) {
                console.log(`❌ Error with batch size ${batchSize}: ${error.message}`);
            }
            
            // Add delay between attempts
            if (attempts < maxAttempts) {
                console.log('⏱️ Waiting 3 seconds before next attempt...');
                await sleep(3000);
            }
        }
        
        // Strategy 2: If we still don't have all, try multiple smaller requests
        if (allPosts.length < totalVideos && allPosts.length > 0) {
            console.log(`\n🔄 Strategy 2: Multiple smaller requests...`);
            console.log(`Current: ${allPosts.length}/${totalVideos} videos`);
            
            // Try to get more in chunks of 50
            let currentCount = allPosts.length;
            const chunkSize = 50;
            
            for (let i = 0; i < 5; i++) { // Try up to 5 more requests
                try {
                    console.log(`📊 Additional request ${i + 1}: requesting ${chunkSize} posts...`);
                    
                    const response = await TiktokAPI.GetUserPosts('admisist', {
                        postLimit: currentCount + chunkSize
                    });
                    
                    if (response.status === 'success' && response.result && response.result.length > currentCount) {
                        console.log(`✅ Got ${response.result.length} total posts (+${response.result.length - currentCount} new)`);
                        allPosts = response.result;
                        currentCount = allPosts.length;
                        
                        if (currentCount >= totalVideos) {
                            console.log(`🎉 COMPLETE! Got all ${currentCount} videos!`);
                            break;
                        }
                    } else {
                        console.log(`❌ No additional posts retrieved`);
                        break;
                    }
                    
                    await sleep(2000); // Wait between requests
                } catch (error) {
                    console.log(`❌ Error in additional request: ${error.message}`);
                    break;
                }
            }
        }
        
        if (allPosts.length === 0) {
            console.log('❌ Could not retrieve any posts. TikTok API may be completely blocked.');
            return;
        }
        
        console.log(`\n🎉 SCRAPING COMPLETE!`);
        console.log(`📊 Successfully scraped ${allPosts.length} out of ${totalVideos} videos (${Math.round((allPosts.length/totalVideos)*100)}%)`);
        
        // Process all the scraped posts
        const videoMetadata = allPosts.map((post, index) => {
            return {
                postNumber: index + 1,
                id: post.id,
                description: post.desc || '',
                createTime: post.createTime,
                createDate: new Date(post.createTime * 1000).toISOString(),
                
                // Main stats we're interested in
                stats: {
                    views: post.stats.playCount || 0,
                    likes: post.stats.likeCount || post.stats.diggCount || 0,
                    comments: post.stats.commentCount || 0,
                    shares: post.stats.shareCount || 0,
                    collects: post.stats.collectCount || 0
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
                imagePost: post.imagePost || null,
                
                // Music info
                music: post.music ? {
                    title: post.music.title || '',
                    authorName: post.music.authorName || '',
                    duration: post.music.duration || 0,
                    isOriginal: post.music.original || false
                } : null,
                
                // Additional flags
                flags: {
                    duetEnabled: post.duetEnabled === 1,
                    stitchEnabled: post.stitchEnabled === 1,
                    isOriginalItem: post.originalItem === 1,
                    isPrivateItem: post.privateItem === 1,
                    hasImagePost: !!post.imagePost
                }
            };
        });
        
        // Calculate comprehensive statistics
        const totalViews = videoMetadata.reduce((sum, video) => sum + video.stats.views, 0);
        const totalLikes = videoMetadata.reduce((sum, video) => sum + video.stats.likes, 0);
        const totalComments = videoMetadata.reduce((sum, video) => sum + video.stats.comments, 0);
        const totalShares = videoMetadata.reduce((sum, video) => sum + video.stats.shares, 0);
        const totalCollects = videoMetadata.reduce((sum, video) => sum + video.stats.collects, 0);
        
        const avgViews = videoMetadata.length > 0 ? Math.round(totalViews / videoMetadata.length) : 0;
        const avgLikes = videoMetadata.length > 0 ? Math.round(totalLikes / videoMetadata.length) : 0;
        const avgComments = videoMetadata.length > 0 ? Math.round(totalComments / videoMetadata.length) : 0;
        const avgShares = videoMetadata.length > 0 ? Math.round(totalShares / videoMetadata.length) : 0;
        
        // Find top performing videos
        const topByViews = [...videoMetadata].sort((a, b) => b.stats.views - a.stats.views).slice(0, 10);
        const topByLikes = [...videoMetadata].sort((a, b) => b.stats.likes - a.stats.likes).slice(0, 10);
        const topByEngagement = [...videoMetadata].sort((a, b) => 
            (b.stats.likes + b.stats.comments + b.stats.shares) - (a.stats.likes + a.stats.comments + a.stats.shares)
        ).slice(0, 10);
        
        // Analyze posting patterns
        const postsByMonth = {};
        const postsByDay = {};
        videoMetadata.forEach(post => {
            const date = new Date(post.createTime * 1000);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const dayKey = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            postsByMonth[monthKey] = (postsByMonth[monthKey] || 0) + 1;
            postsByDay[dayKey] = (postsByDay[dayKey] || 0) + 1;
        });
        
        // Create comprehensive results object
        const results = {
            scrapedAt: new Date().toISOString(),
            account: '@admisist',
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
                scrapeCompleteness: Math.round((videoMetadata.length / totalVideos) * 100)
            },
            
            summary: {
                totalViews,
                totalLikes,
                totalComments,
                totalShares,
                totalCollects,
                averageViews: avgViews,
                averageLikes: avgLikes,
                averageComments: avgComments,
                averageShares: avgShares,
                engagementRate: totalLikes > 0 ? Math.round((totalLikes / totalViews) * 10000) / 100 : 0 // percentage
            },
            
            topPerformers: {
                byViews: topByViews.map(v => ({
                    postNumber: v.postNumber,
                    id: v.id,
                    description: v.description.substring(0, 100) + (v.description.length > 100 ? '...' : ''),
                    views: v.stats.views,
                    likes: v.stats.likes,
                    comments: v.stats.comments,
                    shares: v.stats.shares,
                    createDate: v.createDate
                })),
                byLikes: topByLikes.map(v => ({
                    postNumber: v.postNumber,
                    id: v.id,
                    description: v.description.substring(0, 100) + (v.description.length > 100 ? '...' : ''),
                    views: v.stats.views,
                    likes: v.stats.likes,
                    comments: v.stats.comments,
                    shares: v.stats.shares,
                    createDate: v.createDate
                })),
                byEngagement: topByEngagement.map(v => ({
                    postNumber: v.postNumber,
                    id: v.id,
                    description: v.description.substring(0, 100) + (v.description.length > 100 ? '...' : ''),
                    views: v.stats.views,
                    likes: v.stats.likes,
                    comments: v.stats.comments,
                    shares: v.stats.shares,
                    totalEngagement: v.stats.likes + v.stats.comments + v.stats.shares,
                    createDate: v.createDate
                }))
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
                }
            },
            
            posts: videoMetadata
        };
        
        // Save to results.json
        const resultsPath = path.join(__dirname, '..', 'results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        
        // Display comprehensive summary
        console.log(`\n📊 COMPREHENSIVE ANALYSIS FOR @admisist:`);
        console.log(`═══════════════════════════════════════════════`);
        console.log(`Account Stats:`);
        console.log(`  📹 Videos Scraped: ${results.accountInfo.videosScraped}/${results.accountInfo.totalVideosOnAccount} (${results.accountInfo.scrapeCompleteness}%)`);
        console.log(`  👥 Followers: ${results.accountInfo.followers?.toLocaleString()}`);
        console.log(`  ❤️ Total Hearts: ${results.accountInfo.totalHearts?.toLocaleString()}`);
        
        console.log(`\nPerformance Metrics:`);
        console.log(`  👀 Total Views: ${totalViews.toLocaleString()}`);
        console.log(`  👍 Total Likes: ${totalLikes.toLocaleString()}`);
        console.log(`  💬 Total Comments: ${totalComments.toLocaleString()}`);
        console.log(`  🔄 Total Shares: ${totalShares.toLocaleString()}`);
        console.log(`  📎 Total Collects: ${totalCollects.toLocaleString()}`);
        
        console.log(`\nAverages per Video:`);
        console.log(`  👀 Avg Views: ${avgViews.toLocaleString()}`);
        console.log(`  👍 Avg Likes: ${avgLikes.toLocaleString()}`);
        console.log(`  💬 Avg Comments: ${avgComments.toLocaleString()}`);
        console.log(`  🔄 Avg Shares: ${avgShares.toLocaleString()}`);
        console.log(`  📊 Engagement Rate: ${results.summary.engagementRate}%`);
        
        if (topByViews.length > 0) {
            console.log(`\n🏆 Top Performing Videos:`);
            console.log(`  🥇 Most Views: ${topByViews[0].stats.views.toLocaleString()} views`);
            console.log(`  🥇 Most Likes: ${topByLikes[0].stats.likes.toLocaleString()} likes`);
            console.log(`  🥇 Most Engagement: ${topByEngagement[0].stats.likes + topByEngagement[0].stats.comments + topByEngagement[0].stats.shares} total interactions`);
        }
        
        console.log(`\n💾 Complete results saved to: ${resultsPath}`);
        console.log(`📋 Results include all ${videoMetadata.length} videos with full metadata!`);
        
    } catch (error) {
        console.error('❌ Error during aggressive scraping:', error.message);
        console.error('Full error:', error);
    }
}

// Run the aggressive scraper
aggressiveScrapeAllVideos(); 