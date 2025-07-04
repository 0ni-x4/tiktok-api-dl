import Axios from "axios";
import { load } from "cheerio";
import { _tiktokurl } from "../../constants/api";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
/**
 * Tiktok Stalk User
 * @param {string} username - The username you want to stalk
 * @param {string} proxy - Your Proxy (optional)
 * @returns {Promise<TiktokStalkUserResponse>}
 */
export const StalkUser = (username, proxy) => new Promise(async (resolve) => {
    username = username.replace("@", "");
    Axios(`${_tiktokurl}/@${username}`, {
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
        },
        httpsAgent: (proxy &&
            (proxy.startsWith("http") || proxy.startsWith("https")
                ? new HttpsProxyAgent(proxy)
                : proxy.startsWith("socks")
                    ? new SocksProxyAgent(proxy)
                    : undefined)) ||
            undefined
    })
        .then(async ({ data }) => {
        const $ = load(data);
        const result = JSON.parse($("script#__UNIVERSAL_DATA_FOR_REHYDRATION__").text());
        if (!result["__DEFAULT_SCOPE__"] &&
            !result["__DEFAULT_SCOPE__"]["webapp.user-detail"]) {
            return resolve({
                status: "error",
                message: "User not found!"
            });
        }
        const dataUser = result["__DEFAULT_SCOPE__"]["webapp.user-detail"]["userInfo"];
        if (!dataUser) {
            return resolve({
                status: "error",
                message: "User not found!"
            });
        }
        const { user, stats } = parseDataUser(dataUser);
        let response = {
            status: "success",
            result: {
                user,
                stats
            }
        };
        resolve(response);
    })
        .catch((e) => resolve({ status: "error", message: e.message }));
});
const parseDataUser = (dataUser) => {
    // User Info Result
    const user = {
        uid: dataUser.user.id,
        username: dataUser.user.uniqueId,
        nickname: dataUser.user.nickname,
        avatarLarger: dataUser.user.avatarLarger,
        avatarThumb: dataUser.user.avatarThumb,
        avatarMedium: dataUser.user.avatarMedium,
        signature: dataUser.user.signature,
        verified: dataUser.user.verified,
        privateAccount: dataUser.user.privateAccount,
        region: dataUser.user.region,
        commerceUser: dataUser.user.commerceUserInfo.commerceUser,
        usernameModifyTime: dataUser.user.uniqueIdModifyTime,
        nicknameModifyTime: dataUser.user.nickNameModifyTime,
        secUid: dataUser.user.secUid
    };
    // Statistics Result
    const stats = {
        followerCount: dataUser.stats.followerCount,
        followingCount: dataUser.stats.followingCount,
        heartCount: dataUser.stats.heartCount,
        videoCount: dataUser.stats.videoCount,
        likeCount: dataUser.stats.diggCount,
        friendCount: dataUser.stats.friendCount
    };
    return { user, stats };
};
