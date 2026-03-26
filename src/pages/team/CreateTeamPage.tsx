import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createTeam, getMyTeams, uploadTeamLogo } from "@/api/endpoints/team.api";
import type { CreateTeamRequest, Game, TeamLink } from "@/api/types/team";
import { ArrowLeft, ArrowRight, Check, Sparkles, Upload, X } from "lucide-react";
import { MAX_TEAMS_PER_USER } from "@/shared/constants/teamConstants";
import { Input } from "@/design-system/components/Input";
import { Button } from "@/design-system/components";
import TeamWiseLogo from "@/shared/components/TeamWiseLogo";

type Step = 1 | 2 | 3;

export default function CreateTeamPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [tag, setTag] = useState("");
    const [game, setGame] = useState<Game>("CS2");
    const [links, setLinks] = useState<TeamLink[]>([
        { type: "HLTV", url: "" },
        { type: "FACEIT", url: "" },
        { type: "TWITTER", url: "" },
    ]);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getMyTeams().then(teams => {
            if (teams.length >= MAX_TEAMS_PER_USER) navigate("/select-team", { replace: true });
        }).catch(() => {});
    }, [navigate]);

    const steps = [
        { number: 1, title: t("create_team.step_1_title") },
        { number: 2, title: t("create_team.step_2_title") },
        { number: 3, title: t("create_team.step_3_title") },
    ];

    const canGoNext = () => {
        if (currentStep === 1) return name.trim() && tag.trim();
        if (currentStep === 2) return game;
        return true;
    };

    const handleNext = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (currentStep < 3 && canGoNext()) setCurrentStep((prev) => (prev + 1) as Step);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step);
        else navigate("/select-team");
    };

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const clearLogo = () => {
        setLogoFile(null);
        if (logoPreview) URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentStep !== 3) { handleNext(e); return; }
        if (!name.trim() || !tag.trim()) { setError(t("team.create_error_required")); return; }

        setLoading(true);
        setError(null);
        try {
            const payload: CreateTeamRequest = {
                name: name.trim(), tag: tag.trim(), game,
                links: links.filter(link => link.url.trim() !== ""),
            };
            const team = await createTeam(payload);

            // Upload logo after team creation if selected
            if (logoFile) {
                try { await uploadTeamLogo(team.id, logoFile); } catch { /* non-blocking */ }
            }

            navigate("/select-team", { replace: true });
        } catch { setError(t("team.create_error_occurred")); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex flex-col bg-neutral-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.07),transparent)]" />

            {/* Top bar */}
            <div className="relative z-10 px-8 py-5">
                <TeamWiseLogo size={26} />
            </div>

            {/* Centered content */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
                <div className="w-full max-w-lg">
                    {/* Title */}
                    <div className="text-center mb-7">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            <h1 className="text-xl font-bold text-white">{t("create_team.title")}</h1>
                        </div>
                        <p className="text-sm text-neutral-400">{t("create_team.subtitle")}</p>
                    </div>

                    {/* Progress */}
                    <div className="mb-6 max-w-xs mx-auto">
                        <div className="relative flex justify-between">
                            {steps.map((step, index) => (
                                <div key={step.number} className="flex flex-col items-center flex-1 relative">
                                    {index < steps.length - 1 && (
                                        <div className={`absolute top-3 h-0.5 transition-all duration-500 ${
                                            currentStep > step.number ? "bg-indigo-600" : "bg-transparent"
                                        }`} style={{ left: '50%', right: '-50%', marginLeft: '12px', marginRight: '12px' }} />
                                    )}
                                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 text-[10px] font-bold ${
                                        currentStep > step.number
                                            ? "bg-indigo-600 border-indigo-600"
                                            : currentStep === step.number
                                            ? "bg-indigo-500 border-indigo-500 ring-3 ring-indigo-500/20"
                                            : "bg-neutral-900 border-neutral-700"
                                    }`}>
                                        {currentStep > step.number
                                            ? <Check className="w-3 h-3 text-white" />
                                            : <span className={currentStep === step.number ? "text-white" : "text-neutral-500"}>{step.number}</span>
                                        }
                                    </div>
                                    <p className={`text-[10px] font-medium mt-1.5 whitespace-nowrap ${currentStep >= step.number ? "text-neutral-300" : "text-neutral-600"}`}>
                                        {step.title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form Card */}
                    <form onSubmit={handleSubmit}>
                        <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-6 shadow-2xl">
                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {/* Fixed height */}
                            <div className="h-[280px]">
                                {/* Step 1 — Info */}
                                {currentStep === 1 && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div>
                                            <h2 className="text-base font-semibold text-white">{t("create_team.team_info")}</h2>
                                            <p className="text-xs text-neutral-500 mt-0.5">{t("create_team.step_1_description")}</p>
                                        </div>
                                        <Input label={t("team.team_name")} value={name} onChange={e => setName(e.target.value)} placeholder="Vitality" required />
                                        <div>
                                            <Input label={t("team.team_tag")} value={tag} onChange={e => setTag(e.target.value.toUpperCase())} placeholder="VIT" maxLength={5} required />
                                            <p className="text-[10px] text-neutral-600 mt-1">Maximum 5 caractères</p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2 — Identity (game + logo) */}
                                {currentStep === 2 && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div>
                                            <h2 className="text-base font-semibold text-white">{t("create_team.team_identity")}</h2>
                                            <p className="text-xs text-neutral-500 mt-0.5">{t("create_team.step_2_description")}</p>
                                        </div>

                                        {/* Logo upload */}
                                        <div>
                                            <p className="text-[11px] font-medium text-neutral-400 mb-2">{t("team.team_logo")}</p>
                                            <div className="flex items-center gap-4">
                                                {logoPreview ? (
                                                    <div className="relative">
                                                        <img src={logoPreview} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-neutral-700" />
                                                        <button type="button" onClick={clearLogo}
                                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition-colors">
                                                            <X className="w-3 h-3 text-neutral-400" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button type="button" onClick={() => fileInputRef.current?.click()}
                                                        className="w-14 h-14 rounded-xl border-2 border-dashed border-neutral-700 hover:border-neutral-600 flex items-center justify-center transition-colors">
                                                        <Upload className="w-4 h-4 text-neutral-600" />
                                                    </button>
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-xs text-neutral-400">{t("upload.logo_hint")}</p>
                                                    {!logoPreview && (
                                                        <button type="button" onClick={() => fileInputRef.current?.click()}
                                                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium mt-1 transition-colors">
                                                            {t("upload.logo")}
                                                        </button>
                                                    )}
                                                </div>
                                                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                    onChange={handleLogoSelect} className="hidden" />
                                            </div>
                                        </div>

                                        {/* Game selection */}
                                        <div>
                                            <p className="text-[11px] font-medium text-neutral-400 mb-2">{t("team.team_game")}</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { name: "CS2" as const, displayName: t("team.game_cs2"), available: true },
                                                    { name: "VALORANT", displayName: t("team.game_valorant"), available: false },
                                                    { name: "League of Legends", displayName: t("team.game_lol"), available: false },
                                                    { name: "Rocket League", displayName: t("team.game_rocket_league"), available: false },
                                                    { name: "Dota 2", displayName: "Dota 2", available: false },
                                                    { name: "Autre", displayName: t("team.game_other"), available: false },
                                                ].map(({ name: gameName, displayName, available }) => (
                                                    <button key={gameName} type="button"
                                                        onClick={() => { if (available && (gameName === "CS2" || gameName === "VALORANT")) setGame(gameName as Game); }}
                                                        disabled={!available}
                                                        className={`px-2 py-2 rounded-lg border transition-all text-xs font-medium ${
                                                            game === gameName
                                                                ? "bg-indigo-500/10 border-indigo-500 text-white"
                                                                : available
                                                                ? "bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-white"
                                                                : "bg-neutral-800/30 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
                                                        }`}>
                                                        {displayName}
                                                        {!available && <span className="block text-[8px] text-neutral-600 mt-0.5">{t("coming_soon.title")}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 — Links */}
                                {currentStep === 3 && (
                                    <div className="space-y-3.5 animate-fade-in">
                                        <div>
                                            <h2 className="text-base font-semibold text-white">{t("create_team.social_networks")}</h2>
                                            <p className="text-xs text-neutral-500 mt-0.5">{t("create_team.step_3_description")}</p>
                                        </div>
                                        {links.map((link, index) => (
                                            <Input key={link.type}
                                                label={t(`team.${link.type.toLowerCase()}_link`)}
                                                value={link.url}
                                                onChange={e => {
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

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-800">
                                <Button type="button" variant="ghost" onClick={handleBack}>
                                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                                    {t("common.back")}
                                </Button>

                                {currentStep < 3 ? (
                                    <Button type="button" variant="primary" onClick={handleNext} disabled={!canGoNext()}>
                                        {t("common.next")}
                                        <ArrowRight className="w-4 h-4 ml-1.5" />
                                    </Button>
                                ) : (
                                    <Button type="submit" variant="primary" isLoading={loading} disabled={loading}>
                                        {loading ? t("create_team.creating") : t("create_team.create_button")}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
