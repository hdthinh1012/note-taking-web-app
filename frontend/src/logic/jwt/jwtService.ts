export interface TokenPayload {
    username?: string;
    email?: string;
    exp?: number;
}

export class JwtService {
    static decodeToken(token: string): TokenPayload | null {
        const payloadBase64 = token.split('.')[1] ?? '';
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const decodedJwt = JSON.parse(window.atob(base64));
        return decodedJwt;
    }
}