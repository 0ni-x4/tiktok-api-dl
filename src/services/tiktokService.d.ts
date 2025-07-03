export declare class TiktokService {
    /**
     * Generate Signature parameter for TikTok API requests
     * @param {string} id - User ID to generate X-Bogus for
     * @param {string} secUid - User's secure ID
     * @param {number} count - Number of items to request
     * @returns {string} URL with X-Bogus parameter appended
     */
    generateSignature(url: URL): string;
    /**
     * Generate X-Bogus parameter for TikTok API requests
     * @param {string} id - User ID to generate X-Bogus for
     * @param {string} secUid - User's secure ID
     * @param {number} count - Number of items to request
     * @returns {string} URL with X-Bogus parameter appended
     */
    generateXBogus(url: URL, signature?: string): string;
    /**
     * Generate XTTPParams
     * @param {any} params - The params you want to encrypt
     * @returns {string}
     */
    generateXTTParams(params: any): string;
    /**
     * Generate URL with X-Bogus
     * Special thanks to https://github.com/iamatef/xbogus
     * @param {string} username - The username you want to search
     * @param {number} page - The page you want to search
     * @returns {string}
     */
    generateURLXbogus(username: string, page: number): string;
    /**
     * Get JSDOM Options
     * @returns {object}
     */
    private getJsdomOptions;
    private static readonly FILE_PATH;
    private static readonly BASE_URL;
    private static readonly AES_KEY;
    private static readonly AES_IV;
    private signaturejs;
    private webmssdk;
    private resourceLoader;
}
