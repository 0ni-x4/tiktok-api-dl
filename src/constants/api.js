/** Tiktok */
export const _tiktokurl = "https://www.tiktok.com";
export const _tiktokSearchUserFull = (params) => `${_tiktokurl}/api/search/user/full/?${params}`;
export const _tiktokSearchVideoFull = (params) => `${_tiktokurl}/api/search/item/full/?${params}`;
export const _tiktokSearchLiveFull = (params) => `${_tiktokurl}/api/search/live/full/?${params}`;
export const _tiktokGetPosts = (params) => `${_tiktokurl}/api/post/item_list/?${params}`;
export const _tiktokGetComments = (params) => `${_tiktokurl}/api/comment/list/?${params}`;
export const _tiktokGetUserLiked = (params) => `${_tiktokurl}/api/favorite/item_list/?${params}`;
export const _tiktokGetCollection = (params) => `${_tiktokurl}/api/collection/item_list/?${params}`;
export const _tiktokGetPlaylist = (params) => `${_tiktokurl}/api/mix/item_list/?${params}`;
/** Tiktokv */
export const _tiktokvApi = `https://api16-normal-useast5.tiktokv.us`;
export const _tiktokvFeed = (params) => `${_tiktokvApi}/aweme/v1/feed/?${params}`;
/** SSSTik */
export const _ssstikurl = "https://ssstik.io";
export const _ssstikapi = `${_ssstikurl}/abc?url=dl`;
/** Musicaldown */
export const _musicaldownurl = "https://musicaldown.com";
export const _musicaldownapi = `${_musicaldownurl}/download`;
export const _musicaldownmusicapi = `${_musicaldownurl}/mp3/download`;
