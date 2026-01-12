import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CookieService from "@/logic/cookie/cookieService.js";
import type { TokenPayload } from "@/logic/jwt/jwtService.js";

function decodePayload(token: string): TokenPayload | null {
    const jwt = token;
    const payloadBase64 = jwt.split('.')[1] ?? '';
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const decodedJwt = JSON.parse(window.atob(base64));
    return decodedJwt;
}

export default function UserHome() {
    const [username, setUsername] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = CookieService.getCookie("authZToken");
        
        if (!token) {
            setError("Invalid credentials");
            return;
        }

        try {
            const decoded = decodePayload(token) as TokenPayload | null;
            if (decoded && decoded.username) {
                setUsername(decoded.username);
            } else if (decoded && decoded.email) {
                setUsername(decoded.email);
            } else {
                setError("Invalid credentials");
            }
        } catch {
            setError("Invalid credentials");
        }
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500 text-lg">{error}</p>
                <button
                    onClick={() => navigate("/auth/login")}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold">Welcome, {username}!</h1>
        </div>
    );
}
