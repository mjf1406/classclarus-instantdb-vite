/** @format */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

type Theme = "dark" | "light" | "classclarus";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
    theme: "light",
    setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "light",
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark", "classclarus");
        root.classList.add(theme);
    }, [theme]);

    const setTheme = useCallback(
        (newTheme: Theme) => {
            const root = window.document.documentElement;

            // Disable transitions temporarily for instant theme switch
            root.classList.add("disable-transitions");

            localStorage.setItem(storageKey, newTheme);
            setThemeState(newTheme);

            // Re-enable transitions after the theme has been applied
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    root.classList.remove("disable-transitions");
                });
            });
        },
        [storageKey]
    );

    const value = useMemo(
        () => ({
            theme,
            setTheme,
        }),
        [theme, setTheme]
    );

    return (
        <ThemeProviderContext.Provider
            {...props}
            value={value}
        >
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
};
