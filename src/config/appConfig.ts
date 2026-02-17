type ExternalLinks = {
  kofi: string;
};

type AppConfig = {
  apiBaseUrl: string;
  externalLinks: ExternalLinks;
};

const apiBaseUrl = (import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL ?? '').trim()
  : '');

export const appConfig: AppConfig = {
  apiBaseUrl,
  externalLinks: {
    kofi: 'https://ko-fi.com/teamwise',
  },
};

export function buildApiUrl(path: string): string {
  if (!apiBaseUrl) return path;
  if (!path) return apiBaseUrl;
  const normalizedBase = apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
