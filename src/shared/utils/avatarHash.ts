const AVATAR_PALETTE: { bg: string; text: string }[] = [
    { bg: '#4f46e5', text: '#e0e7ff' }, // indigo
    { bg: '#7c3aed', text: '#ede9fe' }, // violet
    { bg: '#0284c7', text: '#e0f2fe' }, // sky
    { bg: '#059669', text: '#d1fae5' }, // emerald
    { bg: '#e11d48', text: '#ffe4e6' }, // rose
    { bg: '#d97706', text: '#fef3c7' }, // amber
    { bg: '#0d9488', text: '#ccfbf1' }, // teal
    { bg: '#db2777', text: '#fce7f3' }, // pink
    { bg: '#2563eb', text: '#dbeafe' }, // blue
    { bg: '#16a34a', text: '#dcfce7' }, // green
];

function hashString(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

export function getAvatarPalette(seed: string): { bg: string; text: string } {
    return AVATAR_PALETTE[hashString(seed) % AVATAR_PALETTE.length];
}
