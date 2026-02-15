type Props = {
    title: string;
    subtitle: string;
    roleLabel: string;
    isOwner: boolean;
};

export default function ManagementHeader({
                                             title,
                                             subtitle,
                                             roleLabel,
                                             isOwner,
                                         }: Props) {
    return (
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-2xl font-semibold">
                    {title}
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                    {subtitle}
                </p>
            </div>

            <div className="flex gap-2">
                {isOwner && (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-600/20 text-yellow-400">
                        Owner
                    </span>
                )}
                <span className="text-xs px-2 py-1 rounded bg-indigo-600/20 text-indigo-400">
                    {roleLabel}
                </span>
            </div>
        </div>
    );
}
