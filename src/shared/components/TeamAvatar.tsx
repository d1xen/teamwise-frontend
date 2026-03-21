import { useState } from 'react';
import { getAvatarPalette } from '@/shared/utils/avatarHash';

interface TeamAvatarProps {
    logoUrl?: string | null | undefined;
    name: string;
    tag?: string | null | undefined;
    size?: number;
    className?: string;
    shape?: 'rounded' | 'square';
}

export function TeamAvatar({ logoUrl, name, tag, size = 40, className = '', shape = 'rounded' }: TeamAvatarProps) {
    const [imgError, setImgError] = useState(false);
    const initials = (tag && tag.length <= 4 ? tag : name.slice(0, 2)).toUpperCase();
    const { bg, text } = getAvatarPalette(name + (tag ?? ''));
    const roundedClass = shape === 'rounded' ? 'rounded-xl' : 'rounded-none';

    return (
        <div
            className={`flex-shrink-0 overflow-hidden ${roundedClass} ${className}`}
            style={{ width: size, height: size }}
        >
            {logoUrl && !imgError ? (
                <img
                    src={logoUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: bg }}
                >
                    <span
                        className="font-black select-none leading-none"
                        style={{ color: text, fontSize: Math.max(Math.round(size * 0.32), 11) }}
                    >
                        {initials}
                    </span>
                </div>
            )}
        </div>
    );
}
