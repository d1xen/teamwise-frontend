import TeamWiseLogo from "@/shared/components/TeamWiseLogo";

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.07),transparent)]" />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <TeamWiseLogo size={28} />
        <div className="w-4 h-4 border-2 border-neutral-800 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}
