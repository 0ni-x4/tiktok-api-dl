import Axios from "axios";
import { _tiktokGetCollection } from "../../constants/api";
import { _getCollectionParams } from "../../constants/params";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { ERROR_MESSAGES } from "../../constants";
import retry from "async-retry";
import { handleRedirect } from "../downloader/tiktokAPIDownloader";
/** Constants */
const COLLECTION_URL_REGEX = /collection\/[^/]+-(\d+)/;
const createProxyAgent = (proxy) => {
    if (!proxy)
        return {};
    if (proxy.startsWith("socks")) {
        return {
            httpsAgent: new SocksProxyAgent(proxy)
        };
    }
    return {
        httpsAgent: new HttpsProxyAgent(proxy)
    };
};
/**
 * Get TikTok Collection
 * @param {string} collectionId - Collection ID
 * @param {string} proxy - Your Proxy (optional)
 * @param {string} page - Page for pagination (optional)
 * @param {number} count - Number of items to fetch (optional)
 * @returns {Promise<TiktokCollectionResponse>}
 */
export const getCollection = async (collectionId, proxy, page = 1, count = 5) => {
    try {
        const response = await retry(async () => {
            const res = await Axios(_tiktokGetCollection(_getCollectionParams(collectionId, page, count)), {
                method: "GET",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
                    Accept: "*/*",
                    "Accept-Language": "en-US,en;q=0.7",
                    Referer: "https://www.tiktok.com/",
                    Origin: "https://www.tiktok.com"
                },
                ...createProxyAgent(proxy)
            });
            if (res.data && res.data.statusCode === 0) {
                return res.data;
            }
            throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
        }, {
            retries: 20,
            minTimeout: 200,
            maxTimeout: 1000
        });
        return {
            status: "success",
            result: {
                hasMore: response.hasMore,
                itemList: response.itemList || [],
                extra: response.extra
            }
        };
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
        };
    }
};
export const Collection = async (collectionIdOrUrl, options) => {
    try {
        // Only handle redirects if the input is a URL
        const processedUrl = collectionIdOrUrl.startsWith("http")
            ? await handleRedirect(collectionIdOrUrl, options?.proxy)
            : collectionIdOrUrl;
        const collectionId = extractCollectionId(processedUrl);
        if (!collectionId) {
            return {
                status: "error",
                message: "Invalid collection ID or URL format"
            };
        }
        const response = await Axios(_tiktokGetCollection(_getCollectionParams(collectionId, options.page, options.count)), {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
                Accept: "*/*",
                "Accept-Language": "en-US,en;q=0.7",
                Referer: "https://www.tiktok.com/",
                Origin: "https://www.tiktok.com"
            },
            ...createProxyAgent(options?.proxy)
        });
        if (response.data && response.data.status_code === 0) {
            const data = response.data;
            return {
                status: "success",
                result: {
                    itemList: data.itemList || [],
                    hasMore: data.hasMore
                }
            };
        }
        return {
            status: "error",
            message: ERROR_MESSAGES.NETWORK_ERROR
        };
    }
    catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
        };
    }
};
export const extractCollectionId = (input) => {
    // If it's already just a number, return it
    if (/^\d+$/.test(input)) {
        return input;
    }
    // Try to extract from URL
    const match = input.match(COLLECTION_URL_REGEX);
    return match ? match[1] : null;
};
