import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Flag from "react-world-flags";
import { getCountries } from "libphonenumber-js";

import { useAuth } from "@/contexts/auth/useAuth.ts";
import {
    getMyProfile,
    getUserProfile,
    updateMyProfile,
    updateUserProfile,
    type UserProfileUpdateDto,
} from "@/api/endpoints/profile.api";
import type { Game } from "@/api/types/team";
import Loader from "@/shared/components/Loader";

/* ======================
   TYPES
   ====================== */

type FormErrors = Partial<Record<keyof UserProfileUpdateDto, string>>;

interface ProfileFormPanelProps {
    onSuccess?: () => void;
    showHeader?: boolean;
    steamId?: string | undefined;
    teamId?: (number | string) | undefined;
    game?: Game | undefined;
}

/* ======================
   CONSTANTS
   ====================== */

const EMPTY_FORM: Record<string, string> = {
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    countryCode: "",
    address: "",
    zipCode: "",
    city: "",
    phone: "",
    discord: "",
    twitter: "",
    hltv: "",
    customUsername: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ======================
   UTILS
   ====================== */

/**
 * Retourne les types de liens valides selon le jeu de l'équipe
 * Cela vient du backend selon la structure du jeu
 */
function getValidLinksForGame(game?: Game): string[] {
    if (!game) {
        // Pas de jeu spécifié, on retourne tous les liens possibles
        return ["discord", "twitter", "hltv"];
    }

    // Chaque jeu a ses propres liens valides
    const linksByGame: Record<Game, string[]> = {
        CS2: ["discord", "twitter", "hltv"],      // CS2 a HLTV
        VALORANT: ["discord", "twitter"],           // VALORANT n'a pas HLTV
    };

    return linksByGame[game] || [];
}

function normalizeOptional(value?: string): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
}

/* ======================
   COMPONENT
   ====================== */

export default function ProfileFormPanel({
    onSuccess,
    showHeader = true,
    steamId,
    teamId,
    game,
}: ProfileFormPanelProps) {
    const { t } = useTranslation();
    const { user, updateUser } = useAuth();

    const [form, setForm] = useState<Record<string, string>>(EMPTY_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [step, setStep] = useState<1 | 2>(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Determine if we're editing own or another profile
    const isEditingOwnProfile = !steamId || steamId === user?.steamId;

    /* ======================
       COUNTRIES
       ====================== */

    const countries = useMemo(() => {
        const displayNames = new Intl.DisplayNames(["fr"], {
            type: "region",
        });

        return getCountries().map((code) => ({
            code,
            label: displayNames.of(code) ?? code,
        }));
    }, []);

    const selectedCountry = useMemo(
        () => countries.find((c) => c.code === form.countryCode),
        [countries, form.countryCode]
    );

    /* ======================
       LOAD PROFILE
       ====================== */

    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            try {
                let profile;

                if (isEditingOwnProfile) {
                    profile = await getMyProfile();
                } else if (steamId && teamId) {
                    profile = await getUserProfile(steamId, teamId);
                } else {
                    throw new Error("steamId and teamId required for editing other profile");
                }

                if (cancelled) return;

                setForm({
                    firstName: profile.firstName ?? "",
                    lastName: profile.lastName ?? "",
                    email: profile.email ?? "",
                    birthDate: profile.birthDate ?? "",
                    countryCode: profile.countryCode ?? "",
                    address: profile.address ?? "",
                    zipCode: profile.zipCode ?? "",
                    city: profile.city ?? "",
                    phone: profile.phone ?? "",
                    discord: profile.discord ?? "",
                    twitter: profile.twitter ?? "",
                    hltv: profile.hltv ?? "",
                    customUsername: profile.customUsername ?? "",
                });
            } finally {
                if (!cancelled) setIsLoadingProfile(false);
            }
        };

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, [isEditingOwnProfile, steamId, teamId]);

    /* ======================
       HELPERS
       ====================== */

    const updateField = (field: string, value: string) => {
        setForm((prev: Record<string, string>) => ({
            ...prev,
            [field]: value,
        }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validateStep1 = (): boolean => {
        const newErrors: FormErrors = {};

        if (!form.firstName.trim())
            newErrors.firstName = t("profile.first_name_required");

        if (!form.lastName.trim())
            newErrors.lastName = t("profile.last_name_required");

        if (!form.email.trim())
            newErrors.email = t("profile.email_required");
        else if (!EMAIL_REGEX.test(form.email))
            newErrors.email = t("profile.email_invalid");

        if (!form.birthDate)
            newErrors.birthDate = t("profile.birth_date_required");

        if (!form.countryCode)
            newErrors.countryCode = t("profile.country_required");

        if (!form.address.trim())
            newErrors.address = t("profile.address_required");

        if (!form.zipCode.trim())
            newErrors.zipCode = t("profile.zip_code_required");

        if (!form.city.trim())
            newErrors.city = t("profile.city_required");

        if (!form.phone.trim())
            newErrors.phone = t("profile.phone_required");
        else if (!form.phone.startsWith("+"))
            newErrors.phone = t("profile.phone_invalid_format");

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /* ======================
       SUBMIT
       ====================== */

    const handleSubmit = async () => {
        if (isSaving) return;

        setIsSaving(true);

        try {
            const payload: UserProfileUpdateDto = {
                ...form,
                discord: normalizeOptional(form.discord),
                twitter: normalizeOptional(form.twitter),
                hltv: normalizeOptional(form.hltv),
                customUsername: normalizeOptional(form.customUsername),
            };

            let updated;

            if (isEditingOwnProfile) {
                updated = await updateMyProfile(payload, teamId);
                updateUser({ profileCompleted: updated.profileCompleted });
            } else if (steamId && teamId) {
                updated = await updateUserProfile(steamId, payload, teamId);
                // Ne pas mettre à jour le contexte auth pour un autre profil
            } else {
                throw new Error("Missing steamId or teamId");
            }

            // Reset form and notify success
            setStep(1);
            setForm(EMPTY_FORM);
            onSuccess?.();
        } finally {
            setIsSaving(false);
        }
    };

    /* ======================
       RENDER
       ====================== */

    if (isLoadingProfile) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {showHeader && (
                <h2 className="text-xl font-semibold">
                    {t("profile.complete_title")}
                </h2>
            )}

            {/* STEP 1 */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="form-grid-2">
                        <input
                            className="input"
                            placeholder={t("profile.first_name_placeholder")}
                            value={form.firstName}
                            onChange={(e) =>
                                updateField("firstName", e.target.value)
                            }
                        />
                        <input
                            className="input"
                            placeholder={t("profile.last_name_placeholder")}
                            value={form.lastName}
                            onChange={(e) =>
                                updateField("lastName", e.target.value)
                            }
                        />
                    </div>

                    <input
                        className="input"
                        type="email"
                        placeholder={t("profile.email")}
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                    />
                    {errors.email && (
                        <p className="form-error">{errors.email}</p>
                    )}

                    <input
                        className="input"
                        type="date"
                        value={form.birthDate}
                        onChange={(e) =>
                            updateField("birthDate", e.target.value)
                        }
                    />

                    <div className="form-grid-country">
                        <select
                            className="input"
                            value={form.countryCode}
                            onChange={(e) =>
                                updateField("countryCode", e.target.value)
                            }
                        >
                            <option value="">Select country</option>
                            {countries.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.label}
                                </option>
                            ))}
                        </select>

                        {selectedCountry && (
                            <Flag
                                code={selectedCountry.code}
                                className="w-8 h-5 rounded-sm"
                            />
                        )}
                    </div>

                    <input
                        className="input"
                        placeholder={t("profile.address_placeholder")}
                        value={form.address}
                        onChange={(e) =>
                            updateField("address", e.target.value)
                        }
                    />

                    <div className="form-grid-2">
                        <input
                            className="input"
                            placeholder={t("profile.zip_code_placeholder")}
                            value={form.zipCode}
                            onChange={(e) =>
                                updateField("zipCode", e.target.value)
                            }
                        />
                        <input
                            className="input"
                            placeholder={t("profile.city_placeholder")}
                            value={form.city}
                            onChange={(e) =>
                                updateField("city", e.target.value)
                            }
                        />
                    </div>

                    <input
                        className="input"
                        placeholder="+33 6 12 34 56 78"
                        value={form.phone}
                        onChange={(e) =>
                            updateField("phone", e.target.value)
                        }
                    />
                    {errors.phone && (
                        <p className="form-error">{errors.phone}</p>
                    )}

                    <button
                        className="btn-primary w-full"
                        onClick={() => {
                            if (validateStep1()) {
                                setStep(2);
                            }
                        }}
                    >
                        {t("profile.next")}
                    </button>
                </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
                <div className="space-y-4">
                    {/* Afficher Discord et Twitter si disponibles pour ce jeu */}
                    {getValidLinksForGame(game).includes("discord") && (
                        <input
                            className="input"
                            placeholder="Discord username (e.g. pseudo or Pseudo#1234)"
                            value={form.discord}
                            onChange={(e) =>
                                updateField("discord", e.target.value)
                            }
                        />
                    )}

                    {getValidLinksForGame(game).includes("twitter") && (
                        <input
                            className="input"
                            placeholder={t("profile.twitter_placeholder")}
                            value={form.twitter}
                            onChange={(e) =>
                                updateField("twitter", e.target.value)
                            }
                        />
                    )}

                    {/* Afficher HLTV uniquement pour CS2 */}
                    {getValidLinksForGame(game).includes("hltv") && (
                        <input
                            className="input"
                            placeholder={t("profile.hltv_placeholder")}
                            value={form.hltv}
                            onChange={(e) =>
                                updateField("hltv", e.target.value)
                            }
                        />
                    )}

                    {/* Info si aucun lien disponible */}
                    {getValidLinksForGame(game).length === 0 && (
                        <p className="text-sm text-neutral-500">
                            {t("profile.no_links_available")}
                        </p>
                    )}

                    <div className="flex gap-2">
                        <button
                            className="btn-secondary w-full"
                            onClick={() => setStep(1)}
                        >
                            {t("profile.back")}
                        </button>
                        <button
                            className="btn-primary w-full"
                            onClick={handleSubmit}
                            disabled={isSaving}
                        >
                            {t("profile.save_profile")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}





