type ExternalLinks = {
  kofi: string;
  discord: string;
};

type AppConfig = {
  apiBaseUrl: string;
  externalLinks: ExternalLinks;
};

const apiBaseUrl = (import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL ?? '').trim()
  : '');

if (import.meta.env.PROD && !apiBaseUrl) {
  console.error('[Teamwise] VITE_API_URL is required in production. API calls will fail.');
}

export const appConfig: AppConfig = {
  apiBaseUrl,
  externalLinks: {
    kofi: 'https://ko-fi.com/teamwise',
    discord: 'https://discord.gg/YOUR_INVITE_CODE',
  },
};

export function buildApiUrl(path: string): string {
  if (!apiBaseUrl) return path;
  if (!path) return apiBaseUrl;
  const normalizedBase = apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
