import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CookieService from "@/logic/cookie/cookieService.js";
import type { TokenPayload } from "@/logic/jwt/jwtService.js";
import { viewportContext } from "@/global/provider/ViewportProvider.js";
import defaultTheme from "tailwindcss/defaultTheme";
import LaptopSidebar from "@/components/home/sidebar/LaptopSidebar.js";
import MobileSidebar from "@/components/home/sidebar/MobileSidebar.js";
import MobileHeader from "@/components/home/header/MobileHeader.js";
import LaptopAllNotes from "@/components/home/menus/LaptopAllNotes.js";
import MobileAllNotes from "@/components/home/menus/MobileAllNotes.js";

function decodePayload(token: string): TokenPayload | null {
    const jwt = token;
    const payloadBase64 = jwt.split('.')[1] ?? '';
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const decodedJwt = JSON.parse(window.atob(base64));
    return decodedJwt;
}

export default function UserHome() {
    const { width, height } = useContext(viewportContext);
    const [username, setUsername] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(true);
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

    const LaptopUserHome = () => {
        return (<div className="grid grid-cols-[minmax(14rem,18rem)_1fr] w-full min-h-screen">
            <LaptopSidebar />
            <LaptopAllNotes />
        </div>)
    };

    const TabletUserHome = () => {
        return (<div className="grid grid-cols-1 w-full min-h-screen">
            <MobileHeader isSidebarHidden={isSidebarHidden} toggleSidebar={() => setIsSidebarHidden(!isSidebarHidden)} />
            <MobileSidebar isHidden={isSidebarHidden} toggleSidebar={() => setIsSidebarHidden(!isSidebarHidden)} />
            <MobileAllNotes />
        </div>);
    }

    const MobileUserHome = () => {
        return (<div className="grid grid-cols-1 w-full min-h-screen">
            <MobileHeader isSidebarHidden={isSidebarHidden} toggleSidebar={() => setIsSidebarHidden(!isSidebarHidden)} />
            <MobileSidebar isHidden={isSidebarHidden} toggleSidebar={() => setIsSidebarHidden(!isSidebarHidden) }/>
            <MobileAllNotes />
        </div>);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full">
            {/* <h1 className="text-2xl font-bold">Welcome, {username}!</h1> */}
            {/* Add header, sidebar, etc. here if needed */}
            {/* <p>Viewport Size: {width} x {height}</p> */}
            {width >= parseInt(defaultTheme.screens.lg.replace('rem', '')) ? <LaptopUserHome /> :
                    width >= parseInt(defaultTheme.screens.md.replace('rem', '')) ? <TabletUserHome /> :
                        <MobileUserHome />}
        </div>
    );
}
