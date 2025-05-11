import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRequiredUser} from "../../context/AuthContext.tsx";
import { useTeamAccessGuard } from "../../hook/useTeamAccessGuard.ts";
import { limitedToast as toast } from "../../utils/limitedToast.ts";
import { useTranslation } from "react-i18next";
import Flag from "react-world-flags";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import frLocale from "i18n-iso-countries/langs/fr.json";
import { FaTwitter, FaDiscord } from "react-icons/fa";
import faceitIcon from "../../assets/faceit.svg";
import hltvIcon from "../../assets/hltv.png";
import Loader from "../../components/ui/Loader.tsx";

countries.registerLocale(enLocale);
countries.registerLocale(frLocale);

interface StaffMember {
    id: number;
    nickname: string;
    firstName: string;
    lastName: string;
    nationality: string;
    age: number;
    teamRole: string;
    staffPictureUrl: string;
    twitter?: string;
    discord?: string;
    faceit?: string;
    hltvProfileUrl?: string;
}

export default function StaffsPage() {
    const user = useRequiredUser();
    const { teamId } = useParams();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    useTeamAccessGuard(teamId);

    useEffect(() => {
        if (!teamId || !user?.steamId) return;

        setIsLoading(true);
        fetch(`/api/teams/${teamId}/staffs`)
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) setStaff(data);
                else throw new Error("Format de données invalide");
            })
            .catch(() => toast.error(t("staffs.fetch_error")))
            .finally(() => setIsLoading(false));
    }, [teamId, user, t]);

    const getAgeLabel = (age: number) => t("common.years_old", { count: age });

    const getCountryName = (code: string) =>
        countries.getName(code, i18n.language, { select: "official" }) || code;

    return (
        <div className="text-white px-6 pt-12">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">{t("staffs.title")}</h1>

                {isLoading ? (
                    <div className="flex justify-center mt-12">
                        <Loader />
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                            {staff.map(member => (
                                <div
                                    key={member.id}
                                    onClick={() => navigate(`/app/team/${teamId}/profile/staff/${member.id}`)}
                                    className="bg-neutral-800 rounded p-4 cursor-pointer hover:shadow-lg hover:bg-neutral-700 transition flex flex-col justify-start"
                                >
                                    <img
                                        src={member.staffPictureUrl}
                                        alt={member.nickname}
                                        className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border border-neutral-600"
                                    />
                                    <div className="text-left">
                                        <h2 className="text-lg font-semibold truncate">{member.nickname}</h2>
                                        <p className="text-sm text-gray-400 truncate">
                                            {member.firstName} {member.lastName}
                                        </p>
                                        <p className="text-xs text-indigo-300 font-medium mt-1 truncate">
                                            {member.teamRole
                                                ? t(`roles.${member.teamRole}`).toUpperCase()
                                                : `${t("staffs.role_label")} ${t("roles.TBD")}`}
                                        </p>
                                        <div className="mt-2 flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gray-300">
                                            <span title={getCountryName(member.nationality)}>
                                                <Flag code={member.nationality}
                                                      style={{ width: 18, height: 14, borderRadius: 2 }} />
                                            </span>
                                            <span>{getAgeLabel(member.age)}</span>
                                        </div>
                                        <div className="mt-3 flex flex-row-reverse items-center gap-3 text-white text-base">
                                            {member.faceit && (
                                                <a
                                                    href={member.faceit}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 transition-transform transform hover:scale-125 cursor-pointer"
                                                >
                                                    <img src={faceitIcon} alt="FACEIT" title="FACEIT" className="w-4 h-4" />
                                                </a>
                                            )}
                                            {member.hltvProfileUrl && (
                                                <a
                                                    href={member.hltvProfileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 transition-transform transform hover:scale-125 cursor-pointer"
                                                >
                                                    <img
                                                        src={hltvIcon}
                                                        alt="HLTV"
                                                        title="HLTV"
                                                        className="w-4 h-4 rounded-sm"
                                                    />
                                                </a>
                                            )}
                                            {member.twitter && (
                                                <a
                                                    href={member.twitter}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 transition-transform transform hover:scale-125 cursor-pointer"
                                                >
                                                    <FaTwitter title="Twitter" />
                                                </a>
                                            )}
                                            {member.discord && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(member.discord || "");
                                                        toast.success(t("common.discord_copied"));
                                                    }}
                                                    title="Copier le pseudo Discord"
                                                    className="w-4 h-4 transition-transform transform hover:scale-125 cursor-pointer"
                                                >
                                                    <FaDiscord />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {staff.length === 0 && (
                            <p className="text-center text-gray-500 mt-8">{t("staffs.empty")}</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
