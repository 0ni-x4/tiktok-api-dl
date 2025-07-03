import { TiktokAPIResponse } from "../../types/downloader/tiktokApiDownloader";
export declare const handleRedirect: (url: string, proxy?: string) => Promise<string>;
/**
 * Tiktok API Downloader
 * @param {string} url - Tiktok URL
 * @param {string} proxy - Your Proxy (optional)
 * @param {boolean} showOriginalResponse - Show Original Response (optional)
 * @returns {Promise<TiktokAPIResponse>}
 */
export declare const TiktokAPI: (url: string, proxy?: string, showOriginalResponse?: boolean) => Promise<TiktokAPIResponse>;
