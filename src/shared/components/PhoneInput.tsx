import PhoneInputWithCountrySelect from 'react-phone-number-input';
import type { Country, Value } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: string | undefined;
}

export default function PhoneInput({ value, onChange, defaultCountry }: PhoneInputProps) {
  const country = (defaultCountry ?? 'FR') as Country;

  const handleChange = (val?: Value) => {
    onChange(val ?? '');
  };

  // The library expects `value` as `string | E164Number`, not `undefined`.
  // Pass the value as-is (empty string is fine).
  const phoneValue = value as Value;

  return (
    <div className="phone-input-dark">
      <PhoneInputWithCountrySelect
        value={phoneValue}
        onChange={handleChange}
        defaultCountry={country}
        international
        countryCallingCodeEditable={false}
        className="phone-input-container"
      />
    </div>
  );
}
