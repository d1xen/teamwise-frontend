import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "./fr/translation.json";
import en from "./en/translation.json";
import frTerms from "./fr/terms.json";
import enTerms from "./en/terms.json";
import { appStorage } from "@/shared/utils/storage/appStorage";

const savedLanguage = appStorage.getLanguage() || "en";

i18n
    .use(initReactI18next)
    .init({
        resources: {
            fr: {
                translation: fr,
                terms: frTerms
            },
            en: {
                translation: en,
                terms: enTerms
            },
        },
        lng: savedLanguage,
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
    });

i18n.on("languageChanged", (lng) => {
    appStorage.setLanguage(lng);
});

export default i18n;
