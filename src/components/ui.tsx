import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Bot, Provider } from "@/lib/types";

type ButtonVariant = "primary" | "lime" | "secondary" | "ghost" | "soft" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-ink text-paper shadow-[0_1px_2px_rgba(23,32,25,.2),0_7px_16px_-8px_rgba(23,32,25,.5)] hover:bg-ink-soft active:translate-y-px",
    lime: "bg-lime text-ink border border-[#a7d341] hover:bg-[#bdf24d] active:translate-y-px",
    secondary:
      "bg-paper text-ink border border-line hover:border-line-strong hover:bg-paper-warm active:translate-y-px",
    ghost: "text-muted hover:text-ink hover:bg-ink/[.055]",
    soft: "bg-bone-deep text-ink hover:bg-sage/70",
    danger: "bg-coral-soft text-[#a33d21] hover:bg-[#f7d8cd] border border-[#f0c1b2]",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-[11.5px] gap-1.5 rounded-full",
    md: "h-10 px-4 text-[12.5px] gap-2 rounded-full",
    lg: "h-12 px-5 text-[13.5px] gap-2.5 rounded-full",
    icon: "h-9 w-9 rounded-full",
  };
  return (
    <button
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/[.07] hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type BadgeTone = "lime" | "coral" | "sky" | "violet" | "neutral" | "dark" | "outline";

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  const tones: Record<BadgeTone, string> = {
    lime: "bg-lime-soft text-[#4f681c] border-[#d7ecaa]",
    coral: "bg-coral-soft text-[#9b4a2c] border-[#f3cdc0]",
    sky: "bg-sky-soft text-[#3c6783] border-[#cce2f0]",
    violet: "bg-violet-soft text-[#675187] border-[#ded2f1]",
    neutral: "bg-bone-deep text-muted border-line",
    dark: "bg-ink text-paper border-ink",
    outline: "bg-paper/70 text-muted border-line",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-[0.075em] whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export function Panel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative rounded-[22px] border border-line bg-paper shadow-soft", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHead({
  title,
  eyebrow,
  description,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-4 pt-4 pb-3 sm:px-5", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-line bg-bone/70 text-ink/70">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-light">
              {eyebrow}
            </div>
          )}
          <h2 className="truncate text-[15px] font-semibold leading-tight tracking-[-0.025em] text-ink">
            {title}
          </h2>
          {description && <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
    </div>
  );
}

export function Progress({
  value,
  tone = "var(--color-ink)",
  className,
  height = 5,
}: {
  value: number;
  tone?: string;
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-ink/[.08]", className)}
      style={{ height }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: tone }}
      />
    </div>
  );
}

export function Ring({
  value,
  size = 92,
  stroke = 7,
  color = "var(--color-ink)",
  track = "rgba(23,32,25,.09)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Avatar({
  initials,
  color = "#172019",
  size = 32,
  className,
  ring = false,
  label,
}: {
  initials: string;
  color?: string;
  size?: number;
  className?: string;
  ring?: boolean;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-display font-bold text-white",
        ring && "ring-2 ring-paper",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.34,
        border: `1px solid rgba(255,255,255,.22)`,
      }}
      title={label ?? initials}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20" />
      <span className="relative tracking-[-0.02em]">{initials}</span>
    </span>
  );
}

export function BotAvatar({
  bot,
  size = 46,
}: {
  bot: Pick<Bot, "id" | "accent">;
  size?: number;
}) {
  const body = bot.accent;
  const eye = bot.id === "cto" ? "#fbfaf4" : bot.id === "cfo" ? "#fbfaf4" : "#172019";
  return (
    <span
      className="relative inline-grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-black/10 shadow-sm"
      style={{ width: size, height: size, background: `linear-gradient(155deg, ${body} 0%, ${body} 70%, rgba(0,0,0,.12) 100%)` }}
    >
      <svg viewBox="0 0 48 48" width={size * 0.82} height={size * 0.82} aria-hidden="true">
        <path d="M24 7v5" stroke={body} strokeWidth="3" strokeLinecap="round" />
        <circle cx="24" cy="6.5" r="2.5" fill={body} stroke={body} strokeWidth="1" />
        <rect x="9" y="12.5" width="30" height="22" rx="8" fill="#172019" />
        <rect x="9" y="12.5" width="30" height="22" rx="8" fill="url(#none)" />
        <rect x="14" y="18.5" width="20" height="9.5" rx="4.75" fill={eye} />
        <circle cx="19.5" cy="23.25" r="1.9" fill={body} />
        <circle cx="28.5" cy="23.25" r="1.9" fill={body} />
        <path d="M20 30.5c2.5 1.5 5.5 1.5 8 0" stroke={eye} strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
        <rect x="4.5" y="19" width="3" height="9" rx="1.5" fill="#172019" />
        <rect x="40.5" y="19" width="3" height="9" rx="1.5" fill="#172019" />
        <rect x="16" y="36" width="16" height="3" rx="1.5" fill="#172019" opacity=".24" />
      </svg>
    </span>
  );
}

export function ProviderMark({
  provider,
  size = 24,
  className,
}: {
  provider: Provider;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-[7px] border border-black/[.07] font-display font-bold leading-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: provider.soft,
        color: provider.color,
        fontSize: size * (provider.mark.length > 1 ? 0.38 : 0.5),
      }}
      aria-label={provider.name}
      title={provider.name}
    >
      {provider.mark}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full border transition-colors duration-200",
        checked ? "border-ink bg-ink" : "border-line-strong bg-bone-deep",
        disabled && "opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full shadow-sm transition-all duration-200",
          checked ? "left-[18px] bg-lime" : "left-[3px] bg-paper",
        )}
      />
    </button>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 0.1,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className="range-slider"
      value={value}
      min={min}
      max={max}
      step={step}
      aria-label={label}
      onChange={(event) => onChange(Number(event.target.value))}
      style={{ "--range-fill": `${fill}%` } as CSSProperties}
    />
  );
}

export function Field({
  label,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[11px] font-bold uppercase tracking-[0.09em] text-ink/70">
          {label}
        </label>
        {hint && <span className="text-[10.5px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-[12.5px] font-medium text-ink placeholder:text-muted-light/80 transition-all hover:border-line-strong focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line bg-paper px-1 font-mono text-[9px] font-medium text-muted">
      {children}
    </kbd>
  );
}

export function Sparkline({
  values,
  color = "#172019",
  height = 34,
  fill = true,
  className,
}: {
  values: number[];
  color?: string;
  height?: number;
  fill?: boolean;
  className?: string;
}) {
  const rawId = useId();
  const gradientId = `spark-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const width = 120;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - 3 - ((value - min) / range) * (height - 7);
    return [x, y] as const;
  });
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-auto w-full overflow-visible", className)}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradientId})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.2" fill={color} />
    </svg>
  );
}

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  width = "max-w-[680px]",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-ink/35 backdrop-blur-[4px] animate-fade"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Dialog"}
        className={cn(
          "relative max-h-[92vh] w-full overflow-hidden rounded-t-[26px] border border-line bg-paper shadow-float animate-pop sm:rounded-[26px]",
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-[20px] font-semibold leading-tight">{title}</h2>
            {description && <p className="mt-1 max-w-[50ch] text-[12px] leading-relaxed text-muted">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-1 shrink-0">
            <X size={17} />
          </IconButton>
        </div>
        <div className="thin-scroll max-h-[calc(92vh-80px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-line-strong bg-bone/40 px-6 py-10 text-center">
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-line bg-paper text-muted">{icon}</span>
      <h3 className="text-[14px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-[36ch] text-[11.5px] leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
