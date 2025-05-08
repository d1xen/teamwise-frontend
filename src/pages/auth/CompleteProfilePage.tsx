import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.tsx";
import CountrySelector from "../../components/ui/CountrySelector.tsx";
import DateInput from "../../components/ui/DateInput.tsx";
import "../../styles/react-datepicker.css";

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
                if (!res.ok) throw new Error("Erreur HTTP: " + res.status);
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
                        birthDate: user.birthDate || "",
                        twitter: user.twitter || "",
                        discord: user.discord || "",
                        countryCode: user.countryCode || "",
                    }));
                }
            })
            .catch((err) => {
                console.error("Erreur chargement profil:", err);
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
            alert("Merci de remplir tous les champs obligatoires.");
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
            alert("Erreur lors de la mise à jour du profil.");
        }
    };

    if (loading) return <div className="text-white p-6">Chargement...</div>;

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center px-4 relative">
            {step === 2 && (
                <button
                    onClick={() => setStep(1)}
                    className="absolute left-[calc(50%-290px)] top-[50%] translate-y-[-50%] bg-indigo-600 hover:bg-indigo-500 text-white w-11 h-11 rounded-full flex items-center justify-center transition"
                    title="Retour"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                         stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
            )}

            <form
                onSubmit={handleSubmit}
                className="bg-neutral-800 p-8 rounded-lg shadow-lg w-full max-w-md space-y-4"
            >
                <h2 className="text-2xl font-bold mb-2">Complétez votre profil ({step}/2)</h2>

                {step === 1 && (
                    <>
                        {['firstName', 'lastName', 'email'].map((field) => (
                            <input
                                key={field}
                                type={field === 'email' ? 'email' : 'text'}
                                name={field}
                                placeholder={field === 'firstName' ? 'Prénom' : field === 'lastName' ? 'Nom' : 'Email'}
                                value={(formData as any)[field]}
                                onChange={handleChange}
                                className="w-full h-12 px-3 py-2 rounded border-none bg-neutral-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        ))}
                        <DateInput value={formData.birthDate} onChange={handleDateChange} />
                        <CountrySelector value={formData.countryCode} onChange={handleCountryChange} />
                        <button
                            type="button"
                            onClick={handleNext}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded focus:ring-gray-400"
                        >
                            Suivant
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        {['customUsername', 'twitter', 'discord'].map((field) => (
                            <input
                                key={field}
                                type={field === 'twitter' ? 'url' : 'text'}
                                name={field}
                                placeholder={
                                    field === 'customUsername'
                                        ? 'Pseudo officiel'
                                        : field === 'twitter'
                                            ? 'Lien Twitter (facultatif)'
                                            : 'Pseudo Discord (facultatif)'
                                }
                                value={(formData as any)[field]}
                                onChange={handleChange}
                                className="w-full h-12 px-3 py-2 rounded border-none bg-neutral-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        ))}
                        <button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded"
                        >
                            Enregistrer et continuer
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}