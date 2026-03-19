import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { UserProfileDto } from "@/api/endpoints/profile.api";
import type { UserProfileUpdateDto } from "@/api/types/profile";
import type { Game } from "@/api/types/team";
import { getValidLinksForGame } from "@/shared/utils/linksUtils";
import {
  FormInput,
  FormSelect,
} from "@/design-system/components/Form";

const COUNTRIES = [
  { value: "FR", label: "🇫🇷 France" },
  { value: "BE", label: "🇧🇪 Belgium" },
  { value: "CH", label: "🇨🇭 Switzerland" },
  { value: "DE", label: "🇩🇪 Germany" },
  { value: "GB", label: "🇬🇧 United Kingdom" },
  { value: "US", label: "🇺🇸 United States" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "ES", label: "🇪🇸 Spain" },
  { value: "IT", label: "🇮🇹 Italy" },
  { value: "NL", label: "🇳🇱 Netherlands" },
  { value: "PT", label: "🇵🇹 Portugal" },
  { value: "PL", label: "🇵🇱 Poland" },
  { value: "SE", label: "🇸🇪 Sweden" },
  { value: "DK", label: "🇩🇰 Denmark" },
  { value: "FI", label: "🇫🇮 Finland" },
  { value: "NO", label: "🇳🇴 Norway" },
  { value: "BR", label: "🇧🇷 Brazil" },
  { value: "RU", label: "🇷🇺 Russia" },
  { value: "TR", label: "🇹🇷 Turkey" },
  { value: "UA", label: "🇺🇦 Ukraine" },
  { value: "CZ", label: "🇨🇿 Czech Republic" },
  { value: "RO", label: "🇷🇴 Romania" },
  { value: "HU", label: "🇭🇺 Hungary" },
  { value: "AU", label: "🇦🇺 Australia" },
];

interface MemberProfileEditFormProps {
  profile: UserProfileDto;
  game?: Game;
  onSave: (data: UserProfileUpdateDto) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export function MemberProfileEditForm({
  profile,
  game,
  onSave,
  onCancel,
  isSaving = false,
}: MemberProfileEditFormProps) {
  const { t } = useTranslation();
  const validLinks = getValidLinksForGame(game);

  const [formData, setFormData] = useState({
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    birthDate: profile.birthDate ?? "",
    address: profile.address ?? "",
    zipCode: profile.zipCode ?? "",
    city: profile.city ?? "",
    countryCode: profile.countryCode ?? "",
    customUsername: profile.customUsername ?? "",
    discord: profile.discord ?? "",
    twitter: profile.twitter ?? "",
    hltv: profile.hltv ?? "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UserProfileUpdateDto = {
      firstName: formData.firstName || null,
      lastName: formData.lastName || null,
      email: formData.email || null,
      phone: formData.phone || null,
      birthDate: formData.birthDate || null,
      address: formData.address || null,
      zipCode: formData.zipCode || null,
      city: formData.city || null,
      countryCode: formData.countryCode || null,
      customUsername: formData.customUsername || null,
      discord: validLinks.includes("discord") ? (formData.discord || null) : undefined,
      twitter: validLinks.includes("twitter") ? (formData.twitter || null) : undefined,
      hltv: validLinks.includes("hltv") ? (formData.hltv || null) : undefined,
    };
    await onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Identity */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          {t("profile.identity")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label={t("profile.first_name")}
            value={formData.firstName}
            onChange={(v) => handleChange("firstName", v)}
            placeholder="John"
          />
          <FormInput
            label={t("profile.last_name")}
            value={formData.lastName}
            onChange={(v) => handleChange("lastName", v)}
            placeholder="Doe"
          />
          <FormInput
            label={t("profile.birth_date")}
            type="date"
            value={formData.birthDate}
            onChange={(v) => handleChange("birthDate", v)}
          />
          <FormSelect
            label={t("profile.country")}
            value={formData.countryCode}
            onChange={(v) => handleChange("countryCode", v)}
            options={COUNTRIES}
            placeholder={t("profile.select_country")}
          />
        </div>
      </div>

      {/* Contact */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          {t("profile.contact")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label={t("profile.email")}
            type="email"
            value={formData.email}
            onChange={(v) => handleChange("email", v)}
            placeholder="john@example.com"
          />
          <FormInput
            label={t("profile.phone")}
            value={formData.phone}
            onChange={(v) => handleChange("phone", v)}
            placeholder="+33 6 12 34 56 78"
          />
          <div className="col-span-2">
            <FormInput
              label={t("profile.address")}
              value={formData.address}
              onChange={(v) => handleChange("address", v)}
              placeholder="123 Main Street"
            />
          </div>
          <FormInput
            label={t("profile.zip_code")}
            value={formData.zipCode}
            onChange={(v) => handleChange("zipCode", v)}
            placeholder="75001"
          />
          <FormInput
            label={t("profile.city")}
            value={formData.city}
            onChange={(v) => handleChange("city", v)}
            placeholder="Paris"
          />
        </div>
      </div>

      {/* Gaming */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          {t("profile.gaming")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label={t("profile.custom_username")}
            value={formData.customUsername}
            onChange={(v) => handleChange("customUsername", v)}
            placeholder="neo, s1mple…"
          />
          {validLinks.includes("discord") && (
            <FormInput
              label="Discord"
              value={formData.discord}
              onChange={(v) => handleChange("discord", v)}
              placeholder={t("profile.discord_placeholder")}
            />
          )}
          {validLinks.includes("twitter") && (
            <FormInput
              label="Twitter / X"
              value={formData.twitter}
              onChange={(v) => handleChange("twitter", v)}
              placeholder={t("profile.twitter_placeholder")}
            />
          )}
          {validLinks.includes("hltv") && (
            <FormInput
              label="HLTV"
              value={formData.hltv}
              onChange={(v) => handleChange("hltv", v)}
              placeholder={t("profile.hltv_placeholder")}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-neutral-800">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isSaving ? t("common.saving") : t("common.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-sm font-medium rounded-lg transition-colors"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
