import { SSSTikResponse } from "../../types/downloader/ssstikDownloader";
/**
 * Tiktok SSSTik Downloader
 * @param {string} url - Tiktok URL
 * @param {string} proxy - Your Proxy (optional)
 * @returns {Promise<SSSTikResponse>}
 */
export declare const SSSTik: (url: string, proxy?: string) => Promise<SSSTikResponse>;
