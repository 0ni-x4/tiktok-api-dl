import { MusicalDownResponse } from "../../types/downloader/musicaldownDownloader";
/**
 * Tiktok MusicalDown Downloader
 * @param {string} url - Tiktok URL
 * @param {string} proxy - Proxy
 * @returns {Promise<MusicalDownResponse>}
 */
export declare const MusicalDown: (url: string, proxy?: string) => Promise<MusicalDownResponse>;
