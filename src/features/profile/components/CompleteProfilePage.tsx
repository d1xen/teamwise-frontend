import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Flag from "react-world-flags";
import { getCountries } from "libphonenumber-js";

import { useAuth } from "@/contexts/auth/useAuth.ts";
import {
    getMyProfile,
    updateMyProfile,
    type UserProfileUpdateDto,
} from "@/api/profile.api";
import Loader from "@/shared/components/Loader";

/* ======================
   TYPES
   ====================== */

type RedirectState = {
    fromTeamId?: number;
    fromPath?: string;
};

type FormErrors = Partial<Record<keyof UserProfileUpdateDto, string>>;

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

function normalizeOptional(value?: string): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
}

/* ======================
   COMPONENT
   ====================== */

export default function CompleteProfilePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading: isAuthLoading, updateUser } = useAuth();

    const [form, setForm] = useState<Record<string, string>>(EMPTY_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [step, setStep] = useState<1 | 2>(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    /* ======================
       REDIRECT
       ====================== */

    const redirectState = location.state as RedirectState | null;
    const redirectPath =
        redirectState?.fromPath ??
        (redirectState?.fromTeamId
            ? `/team/${redirectState.fromTeamId}/team`
            : "/select-team");

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

        getMyProfile()
            .then((profile) => {
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
            })
            .finally(() => {
                if (!cancelled) setIsLoadingProfile(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    /* ======================
       HELPERS
       ====================== */

    const updateField = (
        field: string,
        value: string
    ) => {
        setForm((prev: Record<string, string>) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validateStep1 = (): boolean => {
        const newErrors: FormErrors = {};

        if (!form.firstName.trim())
            newErrors.firstName = "First name is required";

        if (!form.lastName.trim())
            newErrors.lastName = "Last name is required";

        if (!form.email.trim())
            newErrors.email = "Email is required";
        else if (!EMAIL_REGEX.test(form.email))
            newErrors.email = "Invalid email format";

        if (!form.birthDate)
            newErrors.birthDate = "Birth date is required";

        if (!form.countryCode)
            newErrors.countryCode = "Country is required";

        if (!form.address.trim())
            newErrors.address = "Address is required";

        if (!form.zipCode.trim())
            newErrors.zipCode = "Zip code is required";

        if (!form.city.trim())
            newErrors.city = "City is required";

        if (!form.phone.trim())
            newErrors.phone = "Phone number is required";
        else if (!form.phone.startsWith("+"))
            newErrors.phone =
                "Phone must be in international format (+33…)";

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

            const updated = await updateMyProfile(payload);
            updateUser({ profileCompleted: updated.profileCompleted });
            navigate(redirectPath, { replace: true });
        } finally {
            setIsSaving(false);
        }
    };

    /* ======================
       GUARDS
       ====================== */

    if (isAuthLoading || isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (!user || user.profileCompleted) {
        return <Navigate to={redirectPath} replace />;
    }

    /* ======================
       RENDER
       ====================== */

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-900 px-4">
            <div className="form-card space-y-6">
                <h1 className="text-2xl font-semibold text-center">
                    Complete your profile
                </h1>

                {/* STEP 1 */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="form-grid-2">
                            <input
                                className="input"
                                placeholder="First name"
                                value={form.firstName}
                                onChange={(e) =>
                                    updateField(
                                        "firstName",
                                        e.target.value
                                    )
                                }
                            />
                            <input
                                className="input"
                                placeholder="Last name"
                                value={form.lastName}
                                onChange={(e) =>
                                    updateField(
                                        "lastName",
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <input
                            className="input"
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={(e) =>
                                updateField("email", e.target.value)
                            }
                        />
                        {errors.email && (
                            <p className="form-error">{errors.email}</p>
                        )}

                        <input
                            className="input"
                            type="date"
                            value={form.birthDate}
                            onChange={(e) =>
                                updateField(
                                    "birthDate",
                                    e.target.value
                                )
                            }
                        />

                        <div className="form-grid-country">
                            <select
                                className="input"
                                value={form.countryCode}
                                onChange={(e) =>
                                    updateField(
                                        "countryCode",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">Select country</option>
                                {countries.map((c) => (
                                    <option
                                        key={c.code}
                                        value={c.code}
                                    >
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
                            placeholder="Address"
                            value={form.address}
                            onChange={(e) =>
                                updateField(
                                    "address",
                                    e.target.value
                                )
                            }
                        />

                        <div className="form-grid-2">
                            <input
                                className="input"
                                placeholder="Zip code"
                                value={form.zipCode}
                                onChange={(e) =>
                                    updateField(
                                        "zipCode",
                                        e.target.value
                                    )
                                }
                            />
                            <input
                                className="input"
                                placeholder="City"
                                value={form.city}
                                onChange={(e) =>
                                    updateField(
                                        "city",
                                        e.target.value
                                    )
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
                            Next
                        </button>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className="space-y-4">
                        <input
                            className="input"
                            placeholder="Discord username (e.g. pseudo or Pseudo#1234)"
                            value={form.discord}
                            onChange={(e) =>
                                updateField(
                                    "discord",
                                    e.target.value
                                )
                            }
                        />
                        <input
                            className="input"
                            placeholder="Twitter handle (e.g. @nickname)"
                            value={form.twitter}
                            onChange={(e) =>
                                updateField(
                                    "twitter",
                                    e.target.value
                                )
                            }
                        />
                        <input
                            className="input"
                            placeholder="HLTV nickname or profile (optional)"
                            value={form.hltv}
                            onChange={(e) =>
                                updateField("hltv", e.target.value)
                            }
                        />

                        <div className="flex gap-2">
                            <button
                                className="btn-secondary w-full"
                                onClick={() => setStep(1)}
                            >
                                Back
                            </button>
                            <button
                                className="btn-primary w-full"
                                onClick={handleSubmit}
                                disabled={isSaving}
                            >
                                Save profile
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
