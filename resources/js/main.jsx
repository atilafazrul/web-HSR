import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "../css/app.css";

import { BrowserRouter } from "react-router-dom"; // 👈 TAMBAH INI
import { I18nProvider } from "./i18n/index.jsx";
import { ThemeProvider, applyThemeToDocument } from "./theme/ThemeProvider.jsx";

applyThemeToDocument(localStorage.getItem("app_theme") || "light");

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ThemeProvider>
        <I18nProvider>
            <BrowserRouter>   {/* 👈 BUNGKUS APP */}
                <App />
            </BrowserRouter>
        </I18nProvider>
        </ThemeProvider>
    </React.StrictMode>
);