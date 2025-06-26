const TiktokAPI = require('./lib/index');
const fs = require('fs').promises;

const USERNAME = 'admisist';
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds between batches
const BATCH_SIZE = 50; // Start with 50 per batch
const MAX_TOTAL_VIDEOS = 50; // Test if we can get more than 35 with our fix

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeTikTokAccount() {
    console.log(`🚀 Starting comprehensive scrape of @${USERNAME}`);
    console.log(`📋 Target: Up to ${MAX_TOTAL_VIDEOS} videos`);
    console.log(`⚙️ Using fixed library that handles missing videos gracefully`);
    
    const startTime = Date.now();
    let allVideos = [];
    let totalAttempted = 0;
    
    try {
        console.log(`\n📊 Attempting to fetch up to ${MAX_TOTAL_VIDEOS} videos...`);
        
        const result = await TiktokAPI.GetUserPosts(USERNAME, { postLimit: MAX_TOTAL_VIDEOS });
        
        if (result.status === 'error') {
            throw new Error(result.message);
        }
        
        allVideos = result.result || [];
        totalAttempted = MAX_TOTAL_VIDEOS;
        
        console.log(`\n✅ Successfully collected ${allVideos.length} videos`);
        
        // Process and analyze the data
        const processedVideos = allVideos.map(video => ({
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
                total_videos_attempted: totalAttempted,
                scrape_duration_seconds: Math.round((Date.now() - startTime) / 1000),
                success_rate: `${Math.round((processedVideos.length / totalAttempted) * 100)}%`
            },
            summary: analysis.summary,
            videos: processedVideos,
            analytics: analysis.analytics
        };
        
        // Save to results.json
        await fs.writeFile('results.json', JSON.stringify(results, null, 2));
        
        console.log(`\n📄 Results saved to results.json`);
        console.log(`\n📈 FINAL SUMMARY:`);
        console.log(`   Total videos collected: ${processedVideos.length}`);
        console.log(`   Total videos attempted: ${totalAttempted}`);
        console.log(`   Success rate: ${Math.round((processedVideos.length / totalAttempted) * 100)}%`);
        console.log(`   Scrape duration: ${Math.round((Date.now() - startTime) / 1000)} seconds`);
        console.log(`   Average views per video: ${Math.round(analysis.summary.averageViews).toLocaleString()}`);
        console.log(`   Average likes per video: ${Math.round(analysis.summary.averageLikes).toLocaleString()}`);
        console.log(`   Total engagement: ${Math.round(analysis.summary.totalEngagement).toLocaleString()}`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Scraping failed:', error.message);
        
        // Save partial results if we have any
        if (allVideos.length > 0) {
            const partialResults = {
                metadata: {
                    username: USERNAME,
                    scraped_at: new Date().toISOString(),
                    total_videos_collected: allVideos.length,
                    total_videos_attempted: totalAttempted,
                    error: error.message,
                    partial_results: true
                },
                videos: allVideos
            };
            
            await fs.writeFile('partial_results.json', JSON.stringify(partialResults, null, 2));
            console.log(`💾 Partial results (${allVideos.length} videos) saved to partial_results.json`);
        }
        
        throw error;
    }
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

// Run the scraper
scrapeTikTokAccount()
    .then(() => {
        console.log('\n🎉 Scraping completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Scraping failed:', error);
        process.exit(1);
    }); 