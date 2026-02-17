import { appStorage } from '@/shared/utils/storage/appStorage';

export function getToken(): string | null {
    return appStorage.getJwt();
}

export function setToken(token: string): void {
    appStorage.setJwt(token);
}

export function clearToken(): void {
    appStorage.clearJwt();
}
