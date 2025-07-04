export const validateCookie = (cookie) => {
    if (!cookie)
        return false;
    if (typeof cookie === "string")
        return cookie.length > 0;
    if (Array.isArray(cookie))
        return cookie.length > 0;
    return false;
};
