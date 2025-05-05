export const RememberService = {
    save(steamId: string, days = 7) {
        const expires = Date.now() + days * 24 * 60 * 60 * 1000;
        localStorage.setItem("rememberMe", JSON.stringify({ steamId, expires }));
    },
    load(): string | null {
        const data = localStorage.getItem("rememberMe");
        if (!data) return null;
        const { steamId, expires } = JSON.parse(data);
        if (Date.now() > expires) {
            localStorage.removeItem("rememberMe");
            return null;
        }
        return steamId;
    },
    clear() {
        localStorage.removeItem("rememberMe");
    }
};
