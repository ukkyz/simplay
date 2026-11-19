import { cn } from "@/utils/cn";

export function LogoMark({ size = 38, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-[30%] bg-ink text-lime",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" style={{ width: size * 0.72, height: size * 0.72 }} fill="none">
        <path d="M11 9.8 30.5 20 11 30.2V9.8Z" fill="currentColor" />
        <path
          d="M11 9.8 30.5 20 11 30.2"
          stroke="#fbfaf4"
          strokeOpacity=".16"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="31.3" cy="8.2" r="3.1" fill="#fbfaf4" />
        <circle cx="31.3" cy="8.2" r="1.35" fill="currentColor" />
      </svg>
      <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
    </span>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={compact ? 32 : 38} />
      <span className={cn("font-display font-bold tracking-[-0.05em] text-ink", compact ? "text-[19px]" : "text-[23px]")}>
        simplayz<span className="text-coral">.</span>
      </span>
    </span>
  );
}
