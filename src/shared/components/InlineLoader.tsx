import TeamWiseLogo from "./TeamWiseLogo";

/**
 * Inline centered loader with TeamWise branding.
 * Use instead of raw Loader/spinner icons for page-level loading states.
 */
export default function InlineLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <TeamWiseLogo size={22} />
      <div className="w-4 h-4 border-2 border-neutral-800 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}
