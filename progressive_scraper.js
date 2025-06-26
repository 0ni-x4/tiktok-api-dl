const TiktokAPI = require('./lib/index');
const fs = require('fs').promises;

const USERNAME = 'admisist';
const DELAY_BETWEEN_ATTEMPTS = 3000; // 3 seconds between attempts

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function progressiveScrape() {
    console.log(`🚀 Progressive scraper for @${USERNAME}`);
    console.log(`🎯 Goal: Find maximum possible videos and handle missing videos gracefully`);
    
    const startTime = Date.now();
    let bestResult = null;
    let maxVideos = 0;
    
    // Start with our known working limit and gradually increase
    const testLimits = [35, 36, 37, 38, 39, 40, 45, 50, 60, 70, 80, 90, 100, 150, 200, 300, 400, 500, 544];
    
    for (const limit of testLimits) {
        try {
            console.log(`\n📊 Testing limit: ${limit} videos...`);
            
            const result = await TiktokAPI.GetUserPosts(USERNAME, { postLimit: limit });
            
            if (result.status === 'success' && result.result && result.result.length > 0) {
                console.log(`✅ SUCCESS! Got ${result.result.length} videos with limit ${limit}`);
                
                if (result.result.length > maxVideos) {
                    maxVideos = result.result.length;
                    bestResult = result;
                    console.log(`🎉 New maximum found: ${maxVideos} videos!`);
                }
                
                // If we got fewer videos than requested, we've hit the actual limit
                if (result.result.length < limit) {
                    console.log(`📋 Reached actual limit: requested ${limit}, got ${result.result.length}`);
                    break;
                }
                
            } else {
                console.log(`❌ Failed with limit ${limit}: ${result.message || 'Unknown error'}`);
                
                // If we failed and this is higher than our best, we've found the limit
                if (maxVideos > 0) {
                    console.log(`🛑 Hit limit at ${limit}, sticking with maximum of ${maxVideos} videos`);
                    break;
                }
            }
            
            // Wait between attempts to avoid rate limiting
            await delay(DELAY_BETWEEN_ATTEMPTS);
            
        } catch (error) {
            console.log(`❌ Error at limit ${limit}: ${error.message}`);
            
            // If we have a previous successful result, stop here
            if (maxVideos > 0) {
                console.log(`🛑 Stopping at previous successful limit of ${maxVideos} videos`);
                break;
            }
        }
    }
    
    if (!bestResult || maxVideos === 0) {
        console.log(`💥 Could not retrieve any videos for @${USERNAME}`);
        return;
    }
    
    console.log(`\n🎉 PROGRESSIVE SCRAPING COMPLETE!`);
    console.log(`📊 Maximum videos achieved: ${maxVideos}`);
    console.log(`⏱️ Total time: ${Math.round((Date.now() - startTime) / 1000)} seconds`);
    
    // Process and analyze the best result
    const processedVideos = bestResult.result.map(video => ({
        id: video.id,
        description: video.desc,
        createTime: video.createTime,
        createDate: new Date(video.createTime * 1000).toISOString(),
        stats: {
            views: video.stats.playCount,
            likes: video.stats.diggCount,
            comments: video.stats.commentCount,
            shares: video.stats.shareCount,
            collects: video.stats.collectCount
        },
        author: {
            username: video.author.username,
            nickname: video.author.nickname,
            verified: video.author.verified
        },
        music: video.music ? {
            title: video.music.title,
            author: video.music.authorName,
            original: video.music.original,
            duration: video.music.duration
        } : null,
        video: video.video ? {
            id: video.video.id,
            duration: video.video.duration,
            ratio: video.video.ratio,
            format: video.video.format,
            bitrate: video.video.bitrate
        } : null,
        hashtags: extractHashtags(video.desc || ''),
        metrics: {
            likesToViews: video.stats.playCount > 0 ? video.stats.diggCount / video.stats.playCount : 0,
            commentsToViews: video.stats.playCount > 0 ? video.stats.commentCount / video.stats.playCount : 0,
            sharesToViews: video.stats.playCount > 0 ? video.stats.shareCount / video.stats.playCount : 0,
            engagement: video.stats.playCount > 0 ? 
                (video.stats.diggCount + video.stats.commentCount + video.stats.shareCount) / video.stats.playCount : 0
        }
    }));
    
    // Generate comprehensive analysis
    const analysis = generateAnalysis(processedVideos);
    
    // Create final results object
    const results = {
        metadata: {
            username: USERNAME,
            scraped_at: new Date().toISOString(),
            total_videos_collected: processedVideos.length,
            scraping_method: 'Progressive limit testing',
            max_limit_discovered: maxVideos,
            scrape_duration_seconds: Math.round((Date.now() - startTime) / 1000),
            tiktok_api_limitation: 'TikTok blocks requests for >35 videos, this represents maximum accessible data'
        },
        summary: analysis.summary,
        videos: processedVideos,
        analytics: analysis.analytics
    };
    
    // Save to results.json
    await fs.writeFile('results.json', JSON.stringify(results, null, 2));
    
    console.log(`\n📄 Complete results saved to results.json`);
    console.log(`\n📈 FINAL SUMMARY:`);
    console.log(`   Videos collected: ${processedVideos.length}`);
    console.log(`   API limitation discovered: ${maxVideos} video maximum`);
    console.log(`   Account total videos: 544 (per previous analysis)`);
    console.log(`   Data coverage: ${Math.round((processedVideos.length / 544) * 100)}% of account`);
    console.log(`   Average views per video: ${Math.round(analysis.summary.averageViews).toLocaleString()}`);
    console.log(`   Average likes per video: ${Math.round(analysis.summary.averageLikes).toLocaleString()}`);
    console.log(`   Total engagement: ${Math.round(analysis.summary.totalEngagement).toLocaleString()}`);
    
    return results;
}

function extractHashtags(text) {
    const hashtagRegex = /#[\w\u00c0-\u024f\u1e00-\u1eff]+/g;
    return text.match(hashtagRegex) || [];
}

function generateAnalysis(videos) {
    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, v) => sum + v.stats.views, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.stats.likes, 0);
    const totalComments = videos.reduce((sum, v) => sum + v.stats.comments, 0);
    const totalShares = videos.reduce((sum, v) => sum + v.stats.shares, 0);
    const totalCollects = videos.reduce((sum, v) => sum + v.stats.collects, 0);
    
    // Extract all hashtags and count frequency
    const hashtagCounts = {};
    videos.forEach(video => {
        video.hashtags.forEach(tag => {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
        });
    });
    
    const topHashtags = Object.entries(hashtagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([tag, count]) => ({ tag, count }));
    
    // Sort videos by performance metrics
    const topVideosByViews = [...videos].sort((a, b) => b.stats.views - a.stats.views).slice(0, 10);
    const topVideosByLikes = [...videos].sort((a, b) => b.stats.likes - a.stats.likes).slice(0, 10);
    const topVideosByEngagement = [...videos].sort((a, b) => b.metrics.engagement - a.metrics.engagement).slice(0, 10);
    
    // Temporal analysis
    const videosByMonth = {};
    const videosByDayOfWeek = {};
    const videosByHour = {};
    
    videos.forEach(video => {
        const date = new Date(video.createTime * 1000);
        const month = date.toISOString().substring(0, 7); // YYYY-MM
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        const hour = date.getHours();
        
        videosByMonth[month] = (videosByMonth[month] || 0) + 1;
        videosByDayOfWeek[dayOfWeek] = (videosByDayOfWeek[dayOfWeek] || 0) + 1;
        videosByHour[hour] = (videosByHour[hour] || 0) + 1;
    });
    
    return {
        summary: {
            totalVideos,
            totalViews,
            totalLikes,
            totalComments,
            totalShares,
            totalCollects,
            totalEngagement: totalLikes + totalComments + totalShares + totalCollects,
            averageViews: totalViews / totalVideos,
            averageLikes: totalLikes / totalVideos,
            averageComments: totalComments / totalVideos,
            averageShares: totalShares / totalVideos,
            averageCollects: totalCollects / totalVideos,
            averageEngagementRate: videos.reduce((sum, v) => sum + v.metrics.engagement, 0) / totalVideos,
            dateRange: {
                earliest: new Date(Math.min(...videos.map(v => v.createTime * 1000))).toISOString(),
                latest: new Date(Math.max(...videos.map(v => v.createTime * 1000))).toISOString()
            }
        },
        analytics: {
            topHashtags,
            topVideosByViews: topVideosByViews.map(v => ({
                id: v.id,
                description: v.description.substring(0, 100) + '...',
                views: v.stats.views,
                likes: v.stats.likes,
                engagement: v.metrics.engagement,
                createDate: v.createDate
            })),
            topVideosByLikes: topVideosByLikes.map(v => ({
                id: v.id,
                description: v.description.substring(0, 100) + '...',
                views: v.stats.views,
                likes: v.stats.likes,
                engagement: v.metrics.engagement,
                createDate: v.createDate
            })),
            topVideosByEngagement: topVideosByEngagement.map(v => ({
                id: v.id,
                description: v.description.substring(0, 100) + '...',
                views: v.stats.views,
                likes: v.stats.likes,
                engagement: v.metrics.engagement,
                createDate: v.createDate
            })),
            temporalAnalysis: {
                videosByMonth,
                videosByDayOfWeek,
                videosByHour
            }
        }
    };
}

// Run the progressive scraper
progressiveScrape()
    .then(() => {
        console.log('\n🎉 Progressive scraping completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Progressive scraping failed:', error);
        process.exit(1);
    }); 