import { JSX } from "react";

interface Tab {
    key: string;
    label: string;
    icon: JSX.Element;
}

interface Props {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabKey: string) => void;
}

export default function TeamTabs({ tabs, activeTab, onTabChange }: Props) {
    return (
        <div className="flex overflow-x-auto mb-9 pb-4 border-b border-neutral-700">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key)}
                    className={`relative min-w-[140px] flex flex-col items-center justify-center transition group ${
                        activeTab === tab.key
                            ? "text-indigo-400 font-semibold"
                            : "text-gray-400 hover:text-white"
                    }`}
                >
                    <div className="flex items-center gap-2 text-base tracking-wide uppercase">
                        {tab.icon}
                        {tab.label}
                    </div>
                    <span
                        className={`mt-3 h-[3px] w-16 rounded-full transition-all duration-300 ${
                            activeTab === tab.key
                                ? "bg-indigo-500 scale-x-100"
                                : "bg-transparent scale-x-0 group-hover:scale-x-75"
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}
