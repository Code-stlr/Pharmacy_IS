import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { messages } from "./locales";
export const languages = { en: "English", kk: "Қазақша", ru: "Русский" };
const saved = localStorage.getItem("language");
void i18n
  .use(initReactI18next)
  .init({
    lng: saved && saved in languages ? saved : "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    resources: Object.fromEntries(
      Object.entries(messages).map(([code, translation]) => [
        code,
        { translation },
      ]),
    ),
  });
i18n.on("languageChanged", (code) => {
  localStorage.setItem("language", code);
  document.documentElement.lang = code;
});
export default i18n;
