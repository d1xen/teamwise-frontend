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

/**
 * FormInput - Input épuré et compact
 */
export function FormInput({
  label,
  placeholder,
  value,
  onChange,
  error,
  required,
  disabled,
  type = 'text',
}: FormInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-neutral-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-3 py-2
          bg-neutral-900 border border-neutral-700
          rounded-lg text-sm text-neutral-100 
          placeholder:text-neutral-500
          focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50
          transition-all duration-150
          ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-600'}
        `}
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
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

/**
 * FormSelect - Select épuré et compact
 */
export function FormSelect({
  label,
  value,
  onChange,
  options,
  error,
  required,
  disabled,
  placeholder,
}: FormSelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-neutral-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-3 py-2
          bg-neutral-900 border border-neutral-700
          rounded-lg text-sm text-neutral-100
          focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50
          transition-all duration-150
          appearance-none cursor-pointer
          ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-600'}
        `}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
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

/**
 * FormTextarea - Textarea épuré et compact
 */
export function FormTextarea({
  label,
  placeholder,
  value,
  onChange,
  error,
  required,
  disabled,
  rows = 3,
}: FormTextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-neutral-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          w-full px-3 py-2
          bg-neutral-900 border border-neutral-700
          rounded-lg text-sm text-neutral-100 
          placeholder:text-neutral-500
          focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50
          transition-all duration-150
          resize-none
          ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-600'}
        `}
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}


