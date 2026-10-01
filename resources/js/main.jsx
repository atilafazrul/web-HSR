import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "../css/app.css";

import { BrowserRouter } from "react-router-dom"; // 👈 TAMBAH INI
import { I18nProvider } from "./i18n/index.jsx";
import { ThemeProvider, applyThemeToDocument } from "./theme/ThemeProvider.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

applyThemeToDocument(localStorage.getItem("app_theme") || "light");

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ThemeProvider>
                <I18nProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </I18nProvider>
            </ThemeProvider>
        </ErrorBoundary>
    </React.StrictMode>
);