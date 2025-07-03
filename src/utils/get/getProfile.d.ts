import { TiktokStalkUserResponse } from "../../types/get/getProfile";
/**
 * Tiktok Stalk User
 * @param {string} username - The username you want to stalk
 * @param {string} proxy - Your Proxy (optional)
 * @returns {Promise<TiktokStalkUserResponse>}
 */
export declare const StalkUser: (username: string, proxy?: string) => Promise<TiktokStalkUserResponse>;
