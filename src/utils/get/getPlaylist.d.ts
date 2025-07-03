import { TiktokPlaylistResponse } from "../../types/get/getPlaylist";
/**
 * Get TikTok Collection
 * @param {string} collectionId - Collection ID
 * @param {string} proxy - Your Proxy (optional)
 * @param {string} page - Page for pagination (optional)
 * @param {number} count - Number of items to fetch (optional)
 * @returns {Promise<TiktokPlaylistResponse>}
 */
export declare const getPlaylist: (playlistId: string, proxy?: string, page?: number, count?: number) => Promise<TiktokPlaylistResponse>;
export declare const Playlist: (url: string, options?: {
    page?: number;
    proxy?: string;
    count?: number;
}) => Promise<TiktokPlaylistResponse>;
export declare const extractPlaylistId: (input: string) => string | null;
