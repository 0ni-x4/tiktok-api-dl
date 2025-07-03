import Axios from "axios";
import { _tiktokGetPosts } from "../../constants/api";
import { _getUserPostsParams, _xttParams } from "../../constants/params";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { TiktokService } from "../../services/tiktokService";
import { StalkUser } from "../get/getProfile";
import retry from "async-retry";
export const getUserPosts = (username, proxy, postLimit) => new Promise((resolve) => {
    try {
        StalkUser(username).then(async (res) => {
            if (res.status === "error") {
                return resolve({
                    status: "error",
                    message: res.message
                });
            }
            const secUid = res.result.user.secUid;
            const data = await parseUserPosts(secUid, postLimit, proxy);
            if (!data.length)
                return resolve({
                    status: "error",
                    message: "User not found!"
                });
            resolve({
                status: "success",
                result: data,
                totalPosts: data.length
            });
        });
    }
    catch (err) {
        if (err.status == 400 ||
            (err.response.data && err.response.data.statusCode == 10201)) {
            return resolve({
                status: "error",
                message: "Video not found!"
            });
        }
    }
});
const parseUserPosts = async (secUid, postLimit, proxy) => {
    // Posts Result
    let hasMore = true;
    let cursor = 0;
    const posts = [];
    let counter = 0;
    let emptyResponseCount = 0;
    const Tiktok = new TiktokService();
    while (hasMore) {
        let result = null;
        // Use a fixed count of 20 per request for better pagination
        const requestCount = 20;
        // Generate X-TT-Params for each request with updated cursor
        const xttparams = Tiktok.generateXTTParams(_xttParams(secUid, cursor, requestCount));
        // Prevent missing response posts
        result = await requestUserPosts(proxy, xttparams);
        if (!result || !result.itemList || result.itemList.length === 0) {
            emptyResponseCount++;
            // Only stop if we get 3 consecutive empty responses to handle API glitches
            if (emptyResponseCount >= 3) {
                break;
            }
            // Increment cursor even on empty response and try again
            cursor += requestCount;
            counter++;
            continue;
        }
        // Reset empty response counter if we got results
        emptyResponseCount = 0;
        result?.itemList?.forEach((v) => {
            const author = {
                id: v.author.id,
                username: v.author.uniqueId,
                nickname: v.author.nickname,
                avatarLarger: v.author.avatarLarger,
                avatarThumb: v.author.avatarThumb,
                avatarMedium: v.author.avatarMedium,
                signature: v.author.signature,
                verified: v.author.verified,
                openFavorite: v.author.openFavorite,
                privateAccount: v.author.privateAccount,
                isADVirtual: v.author.isADVirtual,
                isEmbedBanned: v.author.isEmbedBanned
            };
            const music = {
                id: v.music.id,
                title: v.music.title,
                authorName: v.music.authorName,
                playUrl: v.music.playUrl,
                coverThumb: v.music.coverThumb,
                coverMedium: v.music.coverMedium,
                coverLarge: v.music.coverLarge,
                duration: v.music.duration,
                original: v.music.original
            };
            const stats = {
                likeCount: v.stats.diggCount,
                collectCount: v.stats.collectCount,
                playCount: v.stats.playCount,
                shareCount: v.stats.shareCount,
                commentCount: v.stats.commentCount
            };
            if (v.imagePost) {
                const imagePost = v.imagePost.images.map((img) => img.imageURL.urlList[0]);
                posts.push({
                    id: v.id,
                    desc: v.desc,
                    createTime: v.createTime,
                    digged: v.digged,
                    duetEnabled: v.duetEnabled,
                    forFriend: v.forFriend,
                    officalItem: v.officalItem,
                    originalItem: v.originalItem,
                    privateItem: v.privateItem,
                    shareEnabled: v.shareEnabled,
                    stitchEnabled: v.stitchEnabled,
                    stats,
                    music,
                    author,
                    imagePost
                });
            }
            else {
                const video = {
                    id: v.video.id,
                    duration: v.video.duration,
                    ratio: v.video.ratio,
                    cover: v.video.cover,
                    originCover: v.video.originCover,
                    dynamicCover: v.video.dynamicCover,
                    playAddr: v.video.playAddr,
                    downloadAddr: v.video.downloadAddr,
                    format: v.video.format,
                    bitrate: v.video.bitrate
                };
                posts.push({
                    id: v.id,
                    desc: v.desc,
                    createTime: v.createTime,
                    digged: v.digged,
                    duetEnabled: v.duetEnabled,
                    forFriend: v.forFriend,
                    officalItem: v.officalItem,
                    originalItem: v.originalItem,
                    privateItem: v.privateItem,
                    shareEnabled: v.shareEnabled,
                    stitchEnabled: v.stitchEnabled,
                    stats,
                    music,
                    author,
                    video
                });
            }
        });
        // Check post limit if specified
        if (postLimit && posts.length >= postLimit) {
            hasMore = false;
            break;
        }
        // Update cursor based on actual response
        if (result.cursor) {
            cursor = result.cursor;
        }
        else {
            // If no cursor in response, increment by the number of items we got
            cursor += result.itemList.length;
        }
        // Ignore hasMore flag from TikTok - continue until we get empty responses
        // hasMore = result.hasMore || false
        counter++;
        // Add safety limit only for limited requests to prevent infinite loops
        // For unlimited requests, rely on empty response detection
        if (postLimit && counter >= 50) {
            hasMore = false;
            break;
        }
        // Add a small delay between requests to avoid rate limiting
        if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    return postLimit ? posts.slice(0, postLimit) : posts;
};
const requestUserPosts = async (proxy, xttparams = "") => {
    return retry(async (bail, attempt) => {
        try {
            const { data } = await Axios.get(`${_tiktokGetPosts(_getUserPostsParams())}`, {
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.35",
                    "x-tt-params": xttparams
                },
                httpsAgent: (proxy &&
                    (proxy.startsWith("http") || proxy.startsWith("https")
                        ? new HttpsProxyAgent(proxy)
                        : proxy.startsWith("socks")
                            ? new SocksProxyAgent(proxy)
                            : undefined)) ||
                    undefined
            });
            if (data === "") {
                throw new Error("Empty response");
            }
            return data;
        }
        catch (error) {
            if (error.response?.status === 400 ||
                error.response?.data?.statusCode === 10201) {
                bail(new Error("Video not found!"));
                return;
            }
            throw error;
        }
    }, {
        retries: 10,
        minTimeout: 1000,
        maxTimeout: 5000,
        factor: 2,
        onRetry: (error, attempt) => {
            console.log(`Retry attempt ${attempt} due to: ${error}`);
        }
    });
};
