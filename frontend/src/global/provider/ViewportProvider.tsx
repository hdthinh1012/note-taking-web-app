import React, { useContext } from "react";
import { browserFontsizeContext } from "./BrowserFontsizeProvider.js";

export const viewportContext = React.createContext<{
  width: number;
  height: number;
}>({ width: window.innerWidth / 16, height: window.innerHeight / 16 });

export const ViewportProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const { fontSize } = useContext(browserFontsizeContext);
    const [width, setWidth] = React.useState(window.innerWidth / fontSize);
    const [height, setHeight] = React.useState(window.innerHeight / fontSize);

    React.useEffect(() => {
        const handleResize = () => {
            setWidth(window.innerWidth / fontSize);
            setHeight(window.innerHeight / fontSize);
        };

        // Recalculate when fontSize changes
        handleResize();

        console.log("Font size in viewport provider:", fontSize);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [fontSize]); // Re-run when fontSize changes

    return (
        <viewportContext.Provider value={{ width, height}}>{children}</viewportContext.Provider>
    );
};