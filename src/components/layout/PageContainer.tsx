// src/components/layout/PageContainer.tsx
import { ReactNode } from "react";

export default function PageContainer({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
            {children}
        </div>
    );
}