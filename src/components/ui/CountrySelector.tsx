import Select from "react-select";
import Flag from "react-world-flags";
import countryList from "react-select-country-list";

type Props = {
    value: string;
    onChange: (value: string) => void;
};

export default function CountrySelector({ value, onChange }: Props) {
    const options = countryList().getData().map((country) => ({
        value: country.value,
        label: (
            <div className="flex items-center gap-2">
                <Flag code={country.value} style={{ width: 20, height: 15 }} />
                {country.label}
            </div>
        ),
    }));

    const selected = options.find((opt) => opt.value === value) || null;

    return (
        <Select
            instanceId="country-select"
            options={options}
            value={selected}
            onChange={(option) => {
                if (option) onChange((option as any).value);
            }}
            isSearchable
            placeholder="Sélectionner votre pays"
            styles={{
                control: (base, state) => ({
                    ...base,
                    backgroundColor: "#3f3f3f",
                    borderRadius: "0.375rem",
                    border: "none",
                    padding: "0.25rem 0.5rem",
                    minHeight: "48px",
                    boxShadow: state.isFocused ? "0 0 0 2px #9CA3AF" : "none",
                    transition: "all 0.2s",
                }),
                menu: (base) => ({
                    ...base,
                    backgroundColor: "#3f3f3f", // bg-neutral-800
                    borderRadius: "0.5rem",
                    marginTop: "0.25rem",
                    zIndex: 10,
                }),
                option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isSelected
                        ? "#6366f1"
                        : isFocused
                            ? "#4f46e5"
                            : "transparent",
                    color: "white",
                    padding: "0.5rem 0.75rem",
                    cursor: "pointer",
                }),
                singleValue: (base) => ({
                    ...base,
                    color: "white",
                }),
                input: (base) => ({
                    ...base,
                    color: "white",
                }),
                placeholder: (base) => ({
                    ...base,
                    color: "#9CA3AF", // gray-400
                }),
                dropdownIndicator: (base) => ({
                    ...base,
                    color: "#3f3f3f",
                    paddingRight: "0.5rem",
                }),
                indicatorSeparator: () => ({ display: "none" }),
            }}
            theme={(theme) => ({
                ...theme,
                borderRadius: 4, // Tailwind 'rounded' = 4px
                colors: {
                    ...theme.colors,
                    primary: "#6366f1",
                    primary25: "#4f46e5",
                    neutral0: "#1f2937", // bg-neutral-800
                },
            })}
        />
    );
}
