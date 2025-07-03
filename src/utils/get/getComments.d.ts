import { TiktokVideoCommentsResponse } from "../../types/get/getComments";
/**
 * Tiktok Get Comments
 * @param {string} url - Tiktok URL
 * @param {string} proxy - Your Proxy (optional)
 * @param {number} commentLimit - Comment Limit (optional)
 * @returns {Promise<TiktokVideoCommentsResponse>}
 */
export declare const getComments: (url: string, proxy?: string, commentLimit?: number) => Promise<TiktokVideoCommentsResponse>;
