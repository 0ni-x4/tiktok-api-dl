import Axios from "axios";
import { load } from "cheerio";
import { _musicaldownapi, _musicaldownurl } from "../../constants/api";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { ERROR_MESSAGES } from "../../constants";
/** Constants */
const TIKTOK_URL_REGEX = /https:\/\/(?:m|www|vm|vt|lite)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video|photo)\/|\?shareId=|\&item_id=)(\d+))|\w+)/;
const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0";
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
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
const extractRequestForm = ($, url) => {
    const input = $("div > input").map((_, el) => $(el));
    return {
        [input.get(0).attr("name") || ""]: input.get(0).attr("value") || url,
        [input.get(1).attr("name") || ""]: input.get(1).attr("value") || "",
        [input.get(2).attr("name") || ""]: input.get(2).attr("value") || ""
    };
};
const parseImages = ($) => {
    const images = [];
    $("div.row > div[class='col s12 m3']").each((_, v) => {
        const src = $(v).find("img").attr("src");
        if (src)
            images.push(src);
    });
    return images;
};
const parseVideos = ($) => {
    const videos = {};
    const videoContainer = $("div.row > div")
        .map((_, el) => $(el))
        .get(1);
    if (!videoContainer)
        return videos;
    $(videoContainer)
        .find("a")
        .each((_, v) => {
        const href = $(v).attr("href");
        if (!href || href === "#modal2")
            return;
        if (!isValidUrl(href))
            return;
        const dataEvent = $(v).attr("data-event") || "";
        const onclick = $(v).attr("onclick") || "";
        const downloadUrl = href !== undefined ? href : /downloadX\('([^']+)'\)/.exec(onclick)?.[1];
        if (!downloadUrl)
            return;
        if (dataEvent.includes("hd")) {
            videos.videoHD = downloadUrl;
        }
        else if (dataEvent.includes("mp4")) {
            videos.videoSD = downloadUrl;
        }
        else if (dataEvent.includes("watermark")) {
            videos.videoWatermark = downloadUrl;
        }
        else if (href.includes("type=mp3")) {
            videos.music = downloadUrl;
        }
    });
    return videos;
};
const createImageResponse = (images) => ({
    status: "success",
    result: {
        type: "image",
        images
    }
});
const createVideoResponse = ($, videos) => ({
    status: "success",
    result: {
        type: "video",
        author: {
            avatar: $("div.img-area > img").attr("src") || "",
            nickname: $("h2.video-author > b").text()
        },
        desc: $("p.video-desc").text(),
        ...videos
    }
});
const getRequest = async (url, proxy) => {
    try {
        if (!validateTikTokUrl(url)) {
            return {
                status: "error",
                message: ERROR_MESSAGES.INVALID_URL
            };
        }
        const { data, headers } = await Axios(_musicaldownurl, {
            method: "GET",
            headers: {
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Update-Insecure-Requests": "1",
                "User-Agent": USER_AGENT
            },
            ...createProxyAgent(proxy)
        });
        const cookie = headers["set-cookie"]?.[0]?.split(";")[0];
        if (!cookie) {
            return {
                status: "error",
                message: ERROR_MESSAGES.NETWORK_ERROR
            };
        }
        const $ = load(data);
        const request = extractRequestForm($, url);
        return {
            status: "success",
            request,
            cookie
        };
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
        };
    }
};
/**
 * Tiktok MusicalDown Downloader
 * @param {string} url - Tiktok URL
 * @param {string} proxy - Proxy
 * @returns {Promise<MusicalDownResponse>}
 */
export const MusicalDown = async (url, proxy) => {
    try {
        const request = await getRequest(url, proxy);
        if (request.status !== "success") {
            return {
                status: "error",
                message: request.message
            };
        }
        const { data } = await Axios(_musicaldownapi, {
            method: "POST",
            headers: {
                cookie: request.cookie,
                "Content-Type": "application/x-www-form-urlencoded",
                Origin: "https://musicaldown.com",
                Referer: "https://musicaldown.com/en",
                "Upgrade-Insecure-Requests": "1",
                "User-Agent": USER_AGENT
            },
            data: new URLSearchParams(Object.entries(request.request)),
            ...createProxyAgent(proxy)
        });
        const $ = load(data);
        const images = parseImages($);
        if (images.length > 0) {
            return createImageResponse(images);
        }
        const videos = parseVideos($);
        if (Object.keys(videos).length === 0) {
            return {
                status: "error",
                message: "There is an error. Can't find download link"
            };
        }
        return createVideoResponse($, videos);
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
        };
    }
};
