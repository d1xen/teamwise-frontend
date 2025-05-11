import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.tsx";
import CountrySelector from "../../components/ui/CountrySelector.tsx";
import DateInput from "../../components/ui/DateInput.tsx";
import "../../styles/react-datepicker.css";
import { useTranslation } from "react-i18next";
import Loader from "../../components/ui/Loader";
import {BackButton} from "../../components/ui/BackButton.tsx";

interface UserProfile {
    customUsername: string;
    firstName: string;
    lastName: string;
    email: string;
    birthDate: Date | null;
    twitter?: string;
    discord?: string;
    countryCode: string;
}

export default function CompleteProfilePage() {
    const navigate = useNavigate();
    const steamId = localStorage.getItem("steamId");
    const { refreshUser } = useAuth();
    const { t } = useTranslation();

    const [formData, setFormData] = useState<UserProfile>({
        customUsername: "",
        firstName: "",
        lastName: "",
        email: "",
        birthDate: null,
        twitter: "",
        discord: "",
        countryCode: "",
    });

    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<1 | 2>(1);

    useEffect(() => {
        if (!steamId) {
            navigate("/landing");
            return;
        }

        fetch(`/api/auth/steam/me?steamId=${steamId}`)
            .then((res) => {
                if (!res.ok) throw new Error("HTTP error");
                return res.json();
            })
            .then((user) => {
                const isComplete =
                    user.customUsername &&
                    user.firstName &&
                    user.lastName &&
                    user.email &&
                    user.birthDate &&
                    user.countryCode;

                if (isComplete) {
                    navigate("/app/home");
                } else {
                    setFormData((prev) => ({
                        ...prev,
                        customUsername: user.customUsername || "",
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                        email: user.email || "",
                        birthDate: user.birthDate || null,
                        twitter: user.twitter || "",
                        discord: user.discord || "",
                        countryCode: user.countryCode || "",
                    }));
                }
            })
            .catch((err) => {
                console.error("Erreur profil:", err);
            })
            .finally(() => setLoading(false));
    }, [navigate, steamId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDateChange = (date: Date | null) => {
        setFormData({ ...formData, birthDate: date });
    };

    const handleCountryChange = (code: string) => {
        setFormData({ ...formData, countryCode: code });
    };

    const handleNext = () => {
        const { firstName, lastName, email, birthDate, countryCode } = formData;
        if (!firstName || !lastName || !email || !birthDate || !countryCode) {
            alert(t("profile.missing_fields"));
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch(`/api/users/update-profile?steamId=${steamId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...formData,
                birthDate: formData.birthDate
                    ? formData.birthDate.toISOString().split("T")[0]
                    : null,
            }),
        });

        if (response.ok && steamId) {
            await refreshUser(steamId);
            navigate("/app/home");
        } else {
            alert(t("profile.update_error"));
        }
    };

    const inputStyle =
        "w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400";
    const buttonPrimary =
        "w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded shadow";
    const buttonSuccess =
        "w-full h-12 bg-green-600 hover:bg-green-500 text-white font-semibold rounded shadow";

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center px-4 relative">
            {step === 2 && (
                <BackButton onClick={() => setStep(1)} />
            )}

            <form
                onSubmit={handleSubmit}
                className="bg-neutral-800 p-8 rounded-xl shadow-lg w-full max-w-md space-y-5"
            >
                <h2 className="text-2xl font-bold mb-2">
                    {t("profile.title")} ({step}/2)
                </h2>

                {step === 1 && (
                    <>
                        <input
                            type="text"
                            name="firstName"
                            placeholder={t("profile.first_name")}
                            value={formData.firstName}
                            onChange={handleChange}
                            className={inputStyle}
                        />
                        <input
                            type="text"
                            name="lastName"
                            placeholder={t("profile.last_name")}
                            value={formData.lastName}
                            onChange={handleChange}
                            className={inputStyle}
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder={t("profile.email")}
                            value={formData.email}
                            onChange={handleChange}
                            className={inputStyle}
                        />
                        <DateInput
                            value={formData.birthDate}
                            onChange={handleDateChange}
                        />
                        <CountrySelector
                            value={formData.countryCode}
                            onChange={handleCountryChange}
                        />
                        <button type="button" onClick={handleNext} className={buttonPrimary}>
                            {t("profile.next")}
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <input
                            type="text"
                            name="customUsername"
                            placeholder={t("profile.username")}
                            value={formData.customUsername}
                            onChange={handleChange}
                            className={inputStyle}
                        />
                        <input
                            type="url"
                            name="twitter"
                            placeholder={t("profile.twitter")}
                            value={formData.twitter}
                            onChange={handleChange}
                            className={inputStyle}
                        />
                        <input
                            type="text"
                            name="discord"
                            placeholder={t("profile.discord")}
                            value={formData.discord}
                            onChange={handleChange}
                            className={inputStyle}
                        />
                        <button type="submit" className={buttonSuccess}>
                            {t("profile.submit")}
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}
