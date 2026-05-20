import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import pl from "./pl.json";
import en from "./en.json";
import { getStoredValue } from "../utils/storage";

const storedLanguage = getStoredValue("edudoroit_lang", "pl");

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en }
  },
  lng: storedLanguage,
  fallbackLng: "pl",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
