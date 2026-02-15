interface Props {
    label: string;
    description: string;
    permissions: string[];
    selected: boolean;
    onSelect(): void;
}

export default function RoleCard({
                                     label,
                                     description,
                                     permissions,
                                     selected,
                                     onSelect,
                                 }: Props) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={[
                "w-full text-left p-4 rounded-lg border transition",
                selected
                    ? "border-indigo-500 bg-indigo-600/20"
                    : "border-neutral-700 bg-neutral-800 hover:border-neutral-500",
            ].join(" ")}
        >
            <div className="flex justify-between items-start">
                <div>
                    <div className="font-medium text-white">
                        {label}
                    </div>
                    <div className="text-sm text-gray-400">
                        {description}
                    </div>
                </div>

                {selected && (
                    <span className="text-indigo-400 text-sm">
                        Selected
                    </span>
                )}
            </div>

            <ul className="mt-3 space-y-1 text-sm text-gray-300">
                {permissions.map((permission) => (
                    <li key={permission}>
                        • {permission}
                    </li>
                ))}
            </ul>
        </button>
    );
}
