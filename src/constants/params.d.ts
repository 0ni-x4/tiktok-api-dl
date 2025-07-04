/** Get Params */
export declare const _getUserPostsParams: () => string;
export declare const _getUserLikedParams: (id: string, secUid: string, count: number) => string;
export declare const _xttParams: (secUid: string, cursor: number, count: number) => string;
export declare const _getCommentsParams: (id: string, count: number) => string;
/** Search Params */
export declare const _userSearchParams: (keyword: string, page: number, xbogus?: any) => string;
export declare const _liveSearchParams: (keyword: string, page: number) => URLSearchParams;
export declare const _videoSearchParams: (keyword: string, page: number) => string;
/** Downloader Params */
export declare const _tiktokApiParams: (args: any) => string;
declare const randomChar: (char: string, range: number) => string;
declare const generateSearchId: () => string;
declare const generateDeviceId: () => string;
declare const generateOdinId: () => string;
export declare const _getCollectionParams: (collectionId: string, page?: number, count?: number) => string;
export declare const _getPlaylistParams: (playlistId: string, page?: number, 
/**
 * @max 20
 * @default 5
 */
count?: number) => string;
export { randomChar, generateSearchId, generateDeviceId, generateOdinId };
