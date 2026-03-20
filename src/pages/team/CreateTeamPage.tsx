import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createTeam, getMyTeams } from "@/api/endpoints/team.api";
import type { CreateTeamRequest, Game, TeamLink } from "@/api/types/team";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { MAX_TEAMS_PER_USER } from "@/shared/constants/teamConstants";
import { Input } from "@/design-system/components/Input";
import { Button } from "@/design-system/components";

type Step = 1 | 2 | 3;

export default function CreateTeamPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Form data
    const [name, setName] = useState("");
    const [tag, setTag] = useState("");
    const [game, setGame] = useState<Game>("CS2");
    const [links, setLinks] = useState<TeamLink[]>([
        { type: "HLTV", url: "" },
        { type: "FACEIT", url: "" },
        { type: "TWITTER", url: "" },
    ]);

    // UI state
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Guard: redirect if already at team limit
    useEffect(() => {
        getMyTeams().then(teams => {
            if (teams.length >= MAX_TEAMS_PER_USER) {
                navigate("/select-team", { replace: true });
            }
        }).catch(() => {/* ignore, let the form try and surface the backend error */});
    }, [navigate]);

    const steps = [
        { number: 1, title: t("create_team.step_1_title"), description: t("create_team.step_1_description") },
        { number: 2, title: t("create_team.step_2_title"), description: t("create_team.step_2_description") },
        { number: 3, title: t("create_team.step_3_title"), description: t("create_team.step_3_description") },
    ];

    const canGoNext = () => {
        if (currentStep === 1) return name.trim() && tag.trim();
        if (currentStep === 2) return game;
        return true;
    };

    const handleNext = (e?: React.FormEvent) => {
        if (e) e.preventDefault(); // Empêcher la soumission du formulaire
        if (currentStep < 3 && canGoNext()) {
            setCurrentStep((prev) => (prev + 1) as Step);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as Step);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Ne soumettre que si on est à la dernière étape
        if (currentStep !== 3) {
            handleNext(e);
            return;
        }

        if (!name.trim() || !tag.trim()) {
            setError(t("team.create_error_required"));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload: CreateTeamRequest = {
                name: name.trim(),
                tag: tag.trim(),
                game,
                links: links.filter(link => link.url.trim() !== ""),
            };

            const team = await createTeam(payload);
            navigate(`/team/${team.id}/management`);
        } catch {
            setError(t("team.create_error_occurred"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 py-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.07),transparent)]" />

            {/* Back Button */}
            <button
                onClick={() => navigate("/select-team")}
                className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all duration-200 z-10"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">{t("common.back")}</span>
            </button>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                        <h1 className="text-3xl font-bold text-white">{t("create_team.title")}</h1>
                    </div>
                    <p className="text-neutral-400">
                        {t("create_team.subtitle")}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-10 max-w-md mx-auto">
                    <div className="relative">
                        {/* Steps */}
                        <div className="relative flex justify-between">
                            {steps.map((step, index) => (
                                <div key={step.number} className="flex flex-col items-center flex-1 relative">
                                    {/* Line to next circle - only shows when current step is completed */}
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`absolute top-5 h-0.5 transition-all duration-500 ${
                                                currentStep > step.number ? "bg-indigo-600" : "bg-transparent"
                                            }`}
                                            style={{
                                                left: '50%',
                                                right: '-50%',
                                                marginLeft: '20px',
                                                marginRight: '20px'
                                            }}
                                        />
                                    )}

                                    {/* Circle */}
                                    <div
                                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                            currentStep > step.number
                                                ? "bg-indigo-600 border-indigo-600"
                                                : currentStep === step.number
                                                ? "bg-indigo-500 border-indigo-500 ring-4 ring-indigo-500/20"
                                                : "bg-neutral-900 border-neutral-700"
                                        }`}
                                        style={{
                                            boxShadow: currentStep >= step.number ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none'
                                        }}
                                    >
                                        {currentStep > step.number ? (
                                            <Check className="w-5 h-5 text-white" />
                                        ) : (
                                            <span
                                                className={`text-sm font-semibold ${
                                                    currentStep === step.number ? "text-white" : "text-neutral-500"
                                                }`}
                                            >
                                                {step.number}
                                            </span>
                                        )}
                                    </div>
                                    {/* Label */}
                                    <div className="text-center mt-3">
                                        <p
                                            className={`text-xs font-medium whitespace-nowrap ${
                                                currentStep >= step.number ? "text-white" : "text-neutral-500"
                                            }`}
                                        >
                                            {step.title}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 shadow-2xl">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Step Content */}
                        <div className="min-h-[300px]">
                            {/* Step 1: Basic Info */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white mb-2">
                                            {t("create_team.team_info")}
                                        </h2>
                                        <p className="text-sm text-neutral-400">
                                            {t("create_team.step_1_description")}
                                        </p>
                                    </div>

                                    <Input
                                        label={t("team.team_name")}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Exemple: Vitality"
                                        required
                                    />

                                    <Input
                                        label={t("team.team_tag")}
                                        value={tag}
                                        onChange={(e) => setTag(e.target.value.toUpperCase())}
                                        placeholder="VIT"
                                        maxLength={5}
                                        required
                                    />
                                    <p className="text-xs text-neutral-500 -mt-4">
                                        Maximum 5 caractères
                                    </p>
                                </div>
                            )}

                            {/* Step 2: Game */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white mb-2">
                                            {t("team.team_game")}
                                        </h2>
                                        <p className="text-sm text-neutral-400">
                                            {t("create_team.step_2_description")}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { name: "CS2" as const, displayName: t("team.game_cs2"), available: true },
                                            { name: "VALORANT", displayName: t("team.game_valorant"), available: false },
                                            { name: "League of Legends", displayName: t("team.game_lol"), available: false },
                                            { name: "Dota 2", displayName: "Dota 2", available: false },
                                            { name: "Rocket League", displayName: t("team.game_rocket_league"), available: false },
                                            { name: "Autre", displayName: t("team.game_other"), available: false }
                                        ].map(({ name: gameName, displayName, available }) => (
                                            <button
                                                key={gameName}
                                                type="button"
                                                onClick={() => {
                                                    if (available && (gameName === "CS2" || gameName === "VALORANT")) {
                                                        setGame(gameName as Game);
                                                    }
                                                }}
                                                disabled={!available}
                                                className={`p-4 rounded-xl border-2 transition-all duration-200 relative ${
                                                    game === gameName
                                                        ? "bg-indigo-500/10 border-indigo-500 text-white"
                                                        : available
                                                        ? "bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-white"
                                                        : "bg-neutral-800/30 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
                                                }`}
                                                title={!available ? t("team.game_coming_soon") : ""}
                                            >
                                                <span className="font-medium">{displayName}</span>
                                                {!available && (
                                                    <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 bg-neutral-700 rounded text-neutral-500">
                                                        {t("coming_soon.title")}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Social Links */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white mb-2">
                                            {t("create_team.social_networks")}
                                        </h2>
                                        <p className="text-sm text-neutral-400">
                                            {t("create_team.step_3_description")}
                                        </p>
                                    </div>

                                    {links.map((link, index) => (
                                        <Input
                                            key={link.type}
                                            label={t(`team.${link.type.toLowerCase()}_link`)}
                                            value={link.url}
                                            onChange={(e) => {
                                                const newLinks = [...links];
                                                newLinks[index] = { ...link, url: e.target.value };
                                                setLinks(newLinks);
                                            }}
                                            placeholder={t(`team.${link.type.toLowerCase()}_placeholder`)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-800">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handlePrevious}
                                disabled={currentStep === 1}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t("common.previous")}
                            </Button>

                            {currentStep < 3 ? (
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleNext}
                                    disabled={!canGoNext()}
                                >
                                    {t("common.next")}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={loading}
                                    disabled={loading}
                                >
                                    {loading ? t("create_team.creating") : t("create_team.create_button")}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
