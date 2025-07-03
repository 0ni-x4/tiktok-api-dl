import { TiktokUserSearchResponse } from "../../types/search/userSearch";
/**
 * Tiktok Search User
 * @param {string} username - The username you want to search
 * @param {string | any[]} cookie - Your Tiktok cookie (optional)
 * @param {number} page - The page you want to search (optional)
 * @param {string} proxy - Your Proxy (optional)
 * @returns {Promise<TiktokUserSearchResponse>}
 */
export declare const SearchUser: (username: string, cookie: string | any[], page?: number, proxy?: string) => Promise<TiktokUserSearchResponse>;
