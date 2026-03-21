interface FormInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'date' | 'number' | 'password';
}

export function FormInput({
  label, placeholder, value, onChange, error, required, disabled, type = 'text',
}: FormInputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-[11px] font-medium text-neutral-400">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={[
          "w-full px-3 py-1.5",
          "bg-neutral-800/60 border border-neutral-700/60",
          "rounded-[4px] text-sm text-neutral-100",
          "placeholder:text-neutral-600",
          "focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30",
          "transition-all duration-150",
          error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30" : "",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-neutral-600",
        ].join(" ")}
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

interface FormSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function FormSelect({
  label, value, onChange, options, error, required, disabled, placeholder,
}: FormSelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-[11px] font-medium text-neutral-400">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={[
          "w-full px-3 py-1.5",
          "bg-neutral-800/60 border border-neutral-700/60",
          "rounded-[4px] text-sm text-neutral-100",
          "focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30",
          "transition-all duration-150",
          "appearance-none cursor-pointer",
          error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30" : "",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-neutral-600",
        ].join(" ")}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

interface FormTextareaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export function FormTextarea({
  label, placeholder, value, onChange, error, required, disabled, rows = 3,
}: FormTextareaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-[11px] font-medium text-neutral-400">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={[
          "w-full px-3 py-1.5",
          "bg-neutral-800/60 border border-neutral-700/60",
          "rounded-[4px] text-sm text-neutral-100",
          "placeholder:text-neutral-600",
          "focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30",
          "transition-all duration-150 resize-none",
          error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30" : "",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-neutral-600",
        ].join(" ")}
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
