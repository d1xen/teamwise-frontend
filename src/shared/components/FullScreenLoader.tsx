import { CheckCircle2 } from 'lucide-react';

interface FullScreenLoaderProps {
  title: string;
  subtitle: string;
}

export default function FullScreenLoader({ title, subtitle }: FullScreenLoaderProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping bg-green-500/20 rounded-full" />
            <div className="relative p-4 bg-green-500/10 rounded-full border-2 border-green-500/50">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">
            {title}
          </h2>
          <p className="text-neutral-400">
            {subtitle}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-neutral-700 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
