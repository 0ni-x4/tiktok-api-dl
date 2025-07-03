/** Services */
import { TiktokAPI } from "./utils/downloader/tiktokAPIDownloader";
import { SSSTik } from "./utils/downloader/ssstikDownloader";
import { MusicalDown } from "./utils/downloader/musicaldownDownloader";
import { StalkUser } from "./utils/get/getProfile";
import { SearchUser } from "./utils/search/userSearch";
import { SearchLive } from "./utils/search/liveSearch";
import { getComments } from "./utils/get/getComments";
import { getUserPosts } from "./utils/get/getUserPosts";
import { getUserLiked } from "./utils/get/getUserLiked";
import { SearchVideo } from "./utils/search/videoSearch";
import { getCollection } from "./utils/get/getCollection";
/** Constants */
import { DOWNLOADER_VERSIONS, SEARCH_TYPES } from "./constants";
import { ERROR_MESSAGES } from "./constants";
import { validateCookie } from "./utils/validator";
import { getPlaylist } from "./utils/get/getPlaylist";
import { extractPlaylistId } from "./utils/get/getPlaylist";
import { extractCollectionId } from "./utils/get/getCollection";
/** Helper Functions */
const handleError = (message) => {
    return {
        status: "error",
        message
    };
};
