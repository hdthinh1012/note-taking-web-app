import React from "react";

export const viewportContext = React.createContext<{
  width: number;
  height: number;
}>({ width: window.innerWidth, height: window.innerHeight });

export const ViewportProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [width, setWidth] = React.useState(window.innerWidth);
    const [height, setHeight] = React.useState(window.innerHeight);

    const handleResize = () => {
        setWidth(window.innerWidth);
        setHeight(window.innerHeight);
    };

    React.useEffect(() => {
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <viewportContext.Provider value={{ width, height}}>{children}</viewportContext.Provider>
    );
};