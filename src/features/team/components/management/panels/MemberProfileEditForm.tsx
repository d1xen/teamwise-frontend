/**
 * MemberProfileEditForm.tsx
 * Formulaire d'édition professionnel pour les données du profil d'un membre
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { UserProfileDto } from "@/api/endpoints/profile.api";
import type { SingleValue } from "react-select";
import Select from "react-select";
import { X } from "lucide-react";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import fr from "i18n-iso-countries/langs/fr.json";

// Enregistrer les langues
countries.registerLocale(en);
countries.registerLocale(fr);

interface MemberProfileEditFormProps {
  profile: UserProfileDto;
  onSave: (updatedProfile: Partial<UserProfileDto>) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

interface CountryOption {
  value: string;
  label: string;
}

export function MemberProfileEditForm({
  profile,
  onSave,
  onCancel,
  isSaving = false,
}: MemberProfileEditFormProps) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    email: profile.email || "",
    phone: profile.phone || "",
    city: profile.city || "",
    countryCode: profile.countryCode || "",
  });

  const labelClassName = "block text-xs font-medium text-neutral-400 mb-2";
  const inputClassName =
    "w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:bg-neutral-800/70 transition-colors";

  // Générer la liste des pays
  const countryOptions: CountryOption[] = useMemo(() => {
    const codes = countries.getNames(i18n.language as "en" | "fr");
    return Object.entries(codes)
      .map(([code, name]) => ({
        value: code,
        label: `${name} (${code})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [i18n.language]);

  const selectedCountry = countryOptions.find((opt) => opt.value === formData.countryCode) || null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCountryChange = (
    option: SingleValue<CountryOption>
  ) => {
    setFormData((prev) => ({
      ...prev,
      countryCode: option?.value || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <h3 className="text-sm font-semibold text-white">{t("management.edit_information")}</h3>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-neutral-800 rounded transition-colors"
        >
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prénom */}
          <div>
            <label className={labelClassName}>
              {t("profile.first_name")}
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className={inputClassName}
              placeholder={t("profile.first_name")}
            />
          </div>

          {/* Nom */}
          <div>
            <label className={labelClassName}>
              {t("profile.last_name")}
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className={inputClassName}
              placeholder={t("profile.last_name")}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelClassName}>
              {t("common.email")}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={inputClassName}
              placeholder="example@domain.com"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className={labelClassName}>
              {t("management.phone")}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={inputClassName}
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          {/* Ville */}
          <div>
            <label className={labelClassName}>
              {t("profile.city")}
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className={inputClassName}
              placeholder={t("profile.city")}
            />
          </div>

          {/* Pays */}
          <div>
            <label className={labelClassName}>
              {t("profile.country")}
            </label>
            <Select<CountryOption>
              options={countryOptions}
              value={selectedCountry}
              onChange={handleCountryChange}
              isClearable
              isSearchable
              placeholder={t("profile.country")}
              classNamePrefix="select"
              className="text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: 40,
                  backgroundColor: "rgb(64 64 64 / 0.5)",
                  borderColor: "rgb(55 65 81)",
                  borderRadius: 6,
                  paddingLeft: 2,
                  paddingRight: 2,
                  boxShadow: "none",
                  "&:hover": {
                    borderColor: "rgb(75 85 99)",
                  },
                }),
                valueContainer: (base) => ({
                  ...base,
                  padding: "0 8px",
                }),
                input: (base) => ({
                  ...base,
                  color: "white",
                  margin: 0,
                  padding: 0,
                }),
                singleValue: (base) => ({
                  ...base,
                  color: "white",
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? "rgb(59 130 246)"
                    : state.isFocused
                      ? "rgb(75 85 99)"
                      : "rgb(23 23 23)",
                  color: "white",
                  cursor: "pointer",
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "rgb(23 23 23)",
                  border: "1px solid rgb(55 65 81)",
                }),
                dropdownIndicator: (base) => ({
                  ...base,
                  color: "rgb(156 163 175)",
                  padding: 6,
                }),
                indicatorSeparator: (base) => ({
                  ...base,
                  backgroundColor: "rgb(55 65 81)",
                }),
              }}
            />
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-2 pt-4 border-t border-neutral-800">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
          >
            {isSaving ? t("common.saving") : t("common.save")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

