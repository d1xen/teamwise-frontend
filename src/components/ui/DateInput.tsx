import { fr } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/react-datepicker.css";

type Props = {
    value: Date | null;
    onChange: (date: Date | null) => void;
};

export default function DateInput({ value, onChange }: Props) {
    return (
        <div className="relative z-50 w-full mb-4">
            <DatePicker
                selected={value}
                locale={fr}
                onChange={onChange}
                dateFormat="dd/MM/yyyy"
                placeholderText="Date de naissance"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                popperPlacement="right-start"
                className="w-full h-12 px-3 py-2 rounded border-none bg-neutral-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
        </div>
    );
}
