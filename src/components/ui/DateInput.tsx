import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import { fr, enUS } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/react-datepicker.css";
import { Locale } from "date-fns";

type Props = {
    value: Date | null;
    onChange: (date: Date | null) => void;
};

const localeMap: Record<string, Locale> = {
    fr,
    en: enUS,
};

export default function DateInput({ value, onChange }: Props) {
    const { i18n, t } = useTranslation();
    const currentLang = i18n.language;
    const dateLocale = localeMap[currentLang] || enUS;

    return (
        <div className="relative z-50 w-full mb-4">
            <DatePicker
                selected={value}
                onChange={onChange}
                locale={dateLocale}
                dateFormat={currentLang === "fr" ? "dd/MM/yyyy" : "MM/dd/yyyy"}
                placeholderText={t("form.birthdate_placeholder")}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                popperPlacement="right-start"
                className="w-full h-12 px-3 py-2 rounded border-none bg-neutral-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
        </div>
    );
}
