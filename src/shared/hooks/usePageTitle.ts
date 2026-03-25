import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ROUTE_KEY_MAP: Record<string, string> = {
    dashboard:  "nav.dashboard",
    management: "nav.management",
    agenda:     "nav.schedule",
    matches:    "nav.matches",
    competitions: "nav.competitions",
    stratbook:  "nav.stratbook",
    demo:       "nav.demo",
    scrims:     "nav.scrims",
    stats:      "nav.stats",
    messaging:  "nav.messaging",
};

export function usePageTitle() {
    const { t } = useTranslation();
    const { pathname } = useLocation();

    useEffect(() => {
        const segments = pathname.split("/").filter(Boolean);
        // /team/:id/:feature
        const feature = segments.length >= 3 ? segments[2] : null;
        const key = feature ? ROUTE_KEY_MAP[feature] : null;

        if (key) {
            document.title = `Teamwise | ${t(key)}`;
        } else if (segments[0] === "team" && segments.length <= 2) {
            document.title = `Teamwise | ${t("nav.team")}`;
        } else {
            document.title = "Teamwise";
        }
    }, [pathname, t]);
}
