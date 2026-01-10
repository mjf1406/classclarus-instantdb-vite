/** @format */

import { ThemeProvider } from "@/components/themes/theme-provider";
import { ComponentExample } from "./components/component-example";
import { ThemeSwitcher } from "./components/themes/theme-switcher";

function App({ children }: { children?: React.ReactNode }) {
    return (
        <ThemeProvider
            defaultTheme="dark"
            storageKey="vite-ui-theme"
        >
            {children}
            <div className="fixed p-3 top-0 right-0">
                <ThemeSwitcher />
            </div>
            <ComponentExample />
        </ThemeProvider>
    );
}

export default App;
