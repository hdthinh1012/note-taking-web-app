import React, { useContext } from "react";

export const browserFontsizeContext = React.createContext<{
  fontSize: number;
}>({ fontSize: 16 });

export const BrowserFontsizeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [fontSize, setFontSize] = React.useState(16);

    React.useEffect(() => {
        const computedFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        console.log("Browser font size:", computedFontSize);
        setFontSize(computedFontSize);
    }, []);

    return (
        <browserFontsizeContext.Provider value={{ fontSize }}>{children}</browserFontsizeContext.Provider>
    );
}