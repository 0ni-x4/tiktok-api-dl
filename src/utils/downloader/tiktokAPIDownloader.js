import Axios from "axios";
import asyncRetry from "async-retry";
import { _tiktokvFeed, _tiktokurl } from "../../constants/api";
import { _tiktokApiParams } from "../../constants/params";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { ERROR_MESSAGES } from "../../constants";
/** Constants */
const TIKTOK_URL_REGEX = /https:\/\/(?:m|www|vm|vt|lite)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video|photo)\/|\?shareId=|\&item_id=)(\d+))|\w+)/;
const USER_AGENT = "com.zhiliaoapp.musically/300904 (2018111632; U; Android 10; en_US; Pixel 4; Build/QQ3A.200805.001; Cronet/58.0.2991.0)";
/** Helper Functions */
const createProxyAgent = (proxy) => {
    if (!proxy)
        return {};
    const isHttpProxy = proxy.startsWith("http") || proxy.startsWith("https");
    const isSocksProxy = proxy.startsWith("socks");
    if (!isHttpProxy && !isSocksProxy)
        return {};
    return {
        httpsAgent: isHttpProxy
            ? new HttpsProxyAgent(proxy)
            : new SocksProxyAgent(proxy)
    };
};
const validateTikTokUrl = (url) => {
    return TIKTOK_URL_REGEX.test(url);
};
const extractVideoId = (responseUrl) => {
    const matches = responseUrl.match(/\d{17,21}/g);
    return matches ? matches[0] : null;
};
const parseStatistics = (content) => ({
    commentCount: content.statistics.comment_count,
    likeCount: content.statistics.digg_count,
    shareCount: content.statistics.share_count,
    playCount: content.statistics.play_count,
    downloadCount: content.statistics.download_count
});
const parseAuthor = (content) => ({
    uid: content.author.uid,
    username: content.author.unique_id,
    uniqueId: content.author.unique_id,
    nickname: content.author.nickname,
    signature: content.author.signature,
    region: content.author.region,
    avatarThumb: content.author?.avatar_thumb?.url_list || [],
    avatarMedium: content.author?.avatar_medium?.url_list || [],
    url: `${_tiktokurl}/@${content.author.unique_id}`
});
const parseMusic = (content) => ({
    id: content.music.id,
    title: content.music.title,
    author: content.music.author,
    album: content.music.album,
    playUrl: content.music?.play_url?.url_list || [],
    coverLarge: content.music?.cover_large?.url_list || [],
    coverMedium: content.music?.cover_medium?.url_list || [],
    coverThumb: content.music?.cover_thumb?.url_list || [],
    duration: content.music.duration,
    isCommerceMusic: content.music.is_commerce_music,
    isOriginalSound: content.music.is_original_sound,
    isAuthorArtist: content.music.is_author_artist
});
const parseVideo = (content) => ({
    ratio: content.video.ratio,
    duration: content.video.duration,
    playAddr: content.video?.play_addr?.url_list || [],
    downloadAddr: content.video?.download_addr?.url_list || [],
    cover: content.video?.cover?.url_list || [],
    dynamicCover: content.video?.dynamic_cover?.url_list || [],
    originCover: content.video?.origin_cover?.url_list || []
});
const parseTiktokData = (ID, data) => {
    const content = data?.aweme_list?.find((v) => v.aweme_id === ID);
    if (!content)
        return { content: null };
    return {
        content,
        statistics: parseStatistics(content),
        author: parseAuthor(content),
        music: parseMusic(content)
    };
};
const fetchTiktokData = async (ID, proxy) => {
    try {
        const response = await asyncRetry(async () => {
            const res = await Axios(_tiktokvFeed(_tiktokApiParams({ aweme_id: ID })), {
                method: "OPTIONS",
                headers: { "User-Agent": USER_AGENT },
                ...createProxyAgent(proxy)
            });
            if (res.data && res.data.status_code === 0) {
                return res.data;
            }
            throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
        }, {
            retries: 20,
            minTimeout: 200,
            maxTimeout: 1000
        });
        return parseTiktokData(ID, response);
    }
    catch (error) {
        console.error("Error fetching TikTok data:", error);
        return null;
    }
};
const createImageResponse = (content, author, statistics, music) => ({
    status: "success",
    result: {
        type: "image",
        id: content.aweme_id,
        createTime: content.create_time,
        desc: content.desc,
        isTurnOffComment: content.item_comment_settings === 3,
        hashtag: content.text_extra
            .filter((x) => x.hashtag_name !== undefined)
            .map((v) => v.hashtag_name),
        isADS: content.is_ads,
        author,
        statistics,
        images: content.image_post_info.images?.map((v) => v?.display_image?.url_list[0]) || [],
        music
    }
});
const createVideoResponse = (content, author, statistics, music) => ({
    status: "success",
    result: {
        type: "video",
        id: content.aweme_id,
        createTime: content.create_time,
        desc: content.desc,
        isTurnOffComment: content.item_comment_settings === 3,
        hashtag: content.text_extra
            .filter((x) => x.hashtag_name !== undefined)
            .map((v) => v.hashtag_name),
        isADS: content.is_ads,
        author,
        statistics,
        video: parseVideo(content),
        music
    }
});
export const handleRedirect = async (url, proxy) => {
    try {
        const response = await Axios(url, {
            method: "HEAD",
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 400,
            ...createProxyAgent(proxy)
        });
        // Get the final URL after all redirects
        const finalUrl = response.request.res.responseUrl;
        // Remove query parameters
        return finalUrl.split("?")[0];
    }
    catch (error) {
        console.error("Error handling redirect:", error);
        return url;
    }
};
/**
 * Tiktok API Downloader
 * @param {string} url - Tiktok URL
 * @param {string} proxy - Your Proxy (optional)
 * @param {boolean} showOriginalResponse - Show Original Response (optional)
 * @returns {Promise<TiktokAPIResponse>}
 */
export const TiktokAPI = async (url, proxy, showOriginalResponse) => {
    try {
        if (!validateTikTokUrl(url)) {
            return {
                status: "error",
                message: ERROR_MESSAGES.INVALID_URL
            };
        }
        // Normalize URL
        url = url.replace("https://vm", "https://vt");
        // Get video ID
        const { request } = await Axios(url, {
            method: "HEAD",
            ...createProxyAgent(proxy)
        });
        const videoId = extractVideoId(request.res.responseUrl);
        if (!videoId) {
            return {
                status: "error",
                message: ERROR_MESSAGES.INVALID_URL
            };
        }
        // Fetch TikTok data
        const data = await fetchTiktokData(videoId, proxy);
        if (!data?.content) {
            return {
                status: "error",
                message: ERROR_MESSAGES.NETWORK_ERROR
            };
        }
        const { content, author, statistics, music } = data;
        // Create response based on content type
        const response = content.image_post_info
            ? createImageResponse(content, author, statistics, music)
            : createVideoResponse(content, author, statistics, music);
        // Return original response if requested
        if (showOriginalResponse) {
            return {
                status: "success",
                resultNotParsed: data
            };
        }
        return response;
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
        };
    }
};
