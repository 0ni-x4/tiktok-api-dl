/** Types */
import { TiktokAPIResponse } from "./types/downloader/tiktokApiDownloader";
import { SSSTikResponse } from "./types/downloader/ssstikDownloader";
import { MusicalDownResponse } from "./types/downloader/musicaldownDownloader";
import { UserSearchResult } from "./types/search/userSearch";
import { LiveSearchResult } from "./types/search/liveSearch";
import { VideoSearchResult } from "./types/search/videoSearch";
import { TiktokStalkUserResponse } from "./types/get/getProfile";
import { TiktokVideoCommentsResponse } from "./types/get/getComments";
import { TiktokUserPostsResponse } from "./types/get/getUserPosts";
import { TiktokUserFavoriteVideosResponse } from "./types/get/getUserLiked";
import { TiktokCollectionResponse } from "./types/get/getCollection";
import { TiktokPlaylistResponse } from "./types/get/getPlaylist";
/** Types */
type DownloaderVersion = "v1" | "v2" | "v3";
type SearchType = "user" | "live" | "video";
type TiktokDownloaderResponse<T extends DownloaderVersion> = T extends "v1" ? TiktokAPIResponse : T extends "v2" ? SSSTikResponse : T extends "v3" ? MusicalDownResponse : TiktokAPIResponse;
type SearchResult<T extends SearchType> = {
    type: T;
} & (T extends "user" ? UserSearchResult : T extends "live" ? LiveSearchResult : VideoSearchResult);
type TiktokSearchResponse<T extends SearchType> = {
    status: "success" | "error";
    message?: string;
    result?: SearchResult<T>[];
    page?: number;
    totalResults?: number;
};
/** Main API */
declare const _default: {
    /**
     * Tiktok Downloader
     * @param {string} url - The Tiktok URL you want to download
     * @param {Object} options - The options for downloader
     * @param {DownloaderVersion} options.version - The version of downloader to use
     * @param {string} [options.proxy] - Optional proxy URL
     * @param {boolean} [options.showOriginalResponse] - Whether to show original response
     * @returns {Promise<TiktokDownloaderResponse>}
     */
    Downloader: <T extends DownloaderVersion>(url: string, options?: {
        version: T;
        proxy?: string;
        showOriginalResponse?: boolean;
    }) => Promise<TiktokDownloaderResponse<T>>;
    /**
     * Tiktok Search
     * @param {string} keyword - The query you want to search
     * @param {Object} options - The options for search
     * @param {SearchType} [options.type] - The type of search (user/live/video)
     * @param {string} [options.cookie] - Cookie for authentication
     * @param {number} [options.page] - Page number for pagination
     * @param {string} [options.proxy] - Optional proxy URL
     * @returns {Promise<TiktokSearchResponse>}
     */
    Search: <T extends SearchType>(keyword: string, options?: {
        type?: T;
        cookie: string | any[];
        page?: number;
        proxy?: string;
    }) => Promise<TiktokSearchResponse<T>>;
    /**
     * Tiktok Stalk User
     * @param {string} username - The username you want to stalk
     * @param {Object} options - The options for stalk
     * @param {string|Array} [options.cookie] - Optional cookie for authentication
     * @param {string} [options.proxy] - Optional proxy URL
     * @returns {Promise<TiktokStalkUserResponse>}
     */
    StalkUser: (username: string, options?: {
        proxy?: string;
    }) => Promise<TiktokStalkUserResponse>;
    /**
     * Tiktok Get Comments
     * @param {string} url - The Tiktok URL you want to get comments
     * @param {Object} options - The options for get comments
     * @param {number} [options.commentLimit] - Limit number of comments to fetch
     * @param {string} [options.proxy] - Optional proxy URL
     * @returns {Promise<TiktokVideoCommentsResponse>}
     */
    GetVideoComments: (url: string, options?: {
        commentLimit?: number;
        proxy?: string;
    }) => Promise<TiktokVideoCommentsResponse>;
    /**
     * Tiktok Get User Posts
     * @param {string} username - The username you want to get posts from
     * @param {Object} options - The options for getting posts
     * @param {number} [options.postLimit] - Limit number of posts to fetch
     * @param {string} [options.proxy] - Optional proxy URL
     * @returns {Promise<TiktokUserPostsResponse>}
     */
    GetUserPosts: (username: string, options?: {
        postLimit?: number;
        proxy?: string;
    }) => Promise<TiktokUserPostsResponse>;
    /**
     * Tiktok Get User Liked Videos
     * @param {string} username - The username you want to get liked videos from
     * @param {Object} options - The options for getting liked videos
     * @param {string|Array} options.cookie - Cookie for authentication
     * @param {number} [options.postLimit] - Limit number of posts to fetch
     * @param {string} [options.proxy] - Optional proxy URL
     * @returns {Promise<TiktokUserFavoriteVideosResponse>}
     */
    GetUserLiked: (username: string, options: {
        cookie: string | any[];
        postLimit?: number;
        proxy?: string;
    }) => Promise<TiktokUserFavoriteVideosResponse>;
    /**
     * Get TikTok Collection
     * @param {string} collectionIdOrUrl - Collection ID or URL (e.g. 7507916135931218695 or https://www.tiktok.com/@username/collection/name-id)
     * @param {Object} options - The options for collection
     * @param {string} [options.proxy] - Optional proxy URL
     * @param {string} [options.page] - Optional page for pagination
     * @param {number} [options.count] - Optional number of items to fetch
     * @returns {Promise<TiktokCollectionResponse>}
     */
    Collection: (collectionIdOrUrl: string, options?: {
        proxy?: string;
        page?: number;
        count?: number;
    }) => Promise<TiktokCollectionResponse>;
    /**
     * Get TikTok Playlist
     * @param {string} playlistIdOrUrl - Playlist ID or URL (e.g. 7507916135931218695 or https://www.tiktok.com/@username/playlist/name-id)
     * @param {Object} options - The options for playlist
     * @param {string} [options.proxy] - Optional proxy URL
     * @param {string} [options.page] - Optional page for pagination
     * @param {number} [options.count] - Optional number of items to fetch(max: 20)
     * @returns {Promise<TiktokPlaylistResponse>}
     */
    Playlist: (playlistIdOrUrl: string, options?: {
        proxy?: string;
        page?: number;
        count?: number;
    }) => Promise<TiktokPlaylistResponse>;
};
export = _default;
