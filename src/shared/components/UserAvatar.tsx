import { useState } from 'react';

interface UserAvatarProps {
    profileImageUrl?: string | null | undefined;
    avatarUrl?: string | null | undefined;
    nickname: string;
    /** Fixed pixel size. Omit to let the parent control dimensions via className. */
    size?: number;
    className?: string;
    shape?: 'rounded' | 'circle';
}

function Silhouette() {
    return (
        <div className="w-full h-full flex items-end justify-center bg-neutral-800 overflow-hidden">
            <svg viewBox="0 0 80 90" className="w-4/5 h-4/5" aria-hidden="true">
                <circle cx="40" cy="26" r="18" fill="#525252" />
                <path d="M6 90 Q6 50 40 44 Q74 50 74 90Z" fill="#525252" />
            </svg>
        </div>
    );
}

export function UserAvatar({
    profileImageUrl,
    avatarUrl,
    nickname,
    size,
    className = '',
    shape = 'rounded',
}: UserAvatarProps) {
    const url = profileImageUrl ?? avatarUrl ?? null;
    const [imgError, setImgError] = useState(false);
    const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
    const sizeStyle = size !== undefined ? { width: size, height: size } : undefined;

    return (
        <div
            className={`flex-shrink-0 overflow-hidden ${roundedClass} ${className}`}
            style={sizeStyle}
        >
            {url && !imgError ? (
                <img
                    src={url}
                    alt={nickname}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'top' }}
                    onError={() => setImgError(true)}
                />
            ) : (
                <Silhouette />
            )}
        </div>
    );
}
