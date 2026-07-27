import React from "react";
import { Globe, Sun, Moon } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { useTheme } from "../theme/ThemeProvider.jsx";
import {
  DashboardSurface,
  DashboardSectionHeading,
} from "../components/dashboard/DashboardPrimitives.jsx";

const themeOptions = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
];

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <DashboardSectionHeading
        title={t("settings", "Pengaturan")}
        subtitle={t(
          "settingsDesc",
          "Atur bahasa tampilan dan tema terang atau gelap."
        )}
      />

      <DashboardSurface className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Globe size={20} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {t("language", "Bahasa")}
              </h3>
              <p className="text-xs text-slate-500">
                {t("languageDesc", "Pilih bahasa antarmuka aplikasi.")}
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 sm:px-6">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            aria-label={t("language", "Bahasa")}
          >
            <option value="id">Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>
      </DashboardSurface>

      <DashboardSurface className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Sun size={20} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {t("theme", "Tema")}
              </h3>
              <p className="text-xs text-slate-500">
                {t("themeDesc", "Terang, gelap, atau mengikuti pengaturan perangkat.")}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 p-5 sm:p-6">
          {themeOptions.map(({ value, icon: Icon }) => {
            const label =
              value === "light"
                ? t("themeLight", "Terang")
                : t("themeDark", "Gelap");
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-medium transition-all
                  ${
                    active
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-500/30"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                <Icon size={22} className={active ? "text-indigo-600" : "text-slate-500"} />
                {label}
              </button>
            );
          })}
        </div>
      </DashboardSurface>
    </div>
  );
}
