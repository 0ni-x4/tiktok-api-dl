import { TiktokLiveSearchResponse } from "../../types/search/liveSearch";
/**
 * Tiktok Search Live
 * @param {string} keyword - The keyword you want to search
 * @param {string | any[]} cookie - Your Tiktok cookie (optional)
 * @param {number} page - The page you want to search (optional)
 * @param {string} proxy - Your Proxy (optional)
 * @returns {Promise<TiktokLiveSearchResponse>}
 */
export declare const SearchLive: (keyword: string, cookie: string | any[], page?: number, proxy?: string) => Promise<TiktokLiveSearchResponse>;
