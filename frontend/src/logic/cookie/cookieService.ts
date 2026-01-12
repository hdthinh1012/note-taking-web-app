class CookieService {
    static getCookie(name: string): string | null {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === name) {
                return cookieValue || null;
            }
        }
        return null;
    }

    static setCookie(name: string, value: string, exp: Date | null): void {
        let cookieString = `${name}=${value}; Path=/; SameSite=Strict;`;
        if (exp) {
            cookieString += ` Expires=${exp.toUTCString()};`;
        }
        document.cookie = cookieString;
    }

    static deleteCookie(name: string): void {
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict;`;
    }
}

export default CookieService;