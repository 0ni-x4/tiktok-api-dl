import { TiktokVideoSearchResponse } from "../../types/search/videoSearch";
/**
 * Tiktok Search Live
 * @param {string} keyword - The keyword you want to search
 * @param {string | any[]} cookie - Your Tiktok cookie (optional)
 * @param {number} page - The page you want to search (optional)
 * @param {string} proxy - Your Proxy (optional)
 * @returns {Promise<TiktokVideoSearchResponse>}
 */
export declare const SearchVideo: (keyword: string, cookie: string | any[], page?: number, proxy?: string) => Promise<TiktokVideoSearchResponse>;
