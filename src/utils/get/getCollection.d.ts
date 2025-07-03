import { TiktokCollectionResponse } from "../../types/get/getCollection";
/**
 * Get TikTok Collection
 * @param {string} collectionId - Collection ID
 * @param {string} proxy - Your Proxy (optional)
 * @param {string} page - Page for pagination (optional)
 * @param {number} count - Number of items to fetch (optional)
 * @returns {Promise<TiktokCollectionResponse>}
 */
export declare const getCollection: (collectionId: string, proxy?: string, page?: number, count?: number) => Promise<TiktokCollectionResponse>;
export declare const Collection: (collectionIdOrUrl: string, options?: {
    page?: number;
    proxy?: string;
    count?: number;
}) => Promise<TiktokCollectionResponse>;
export declare const extractCollectionId: (input: string) => string | null;
