// Design-system primitives. Keep variants small; compose rather than add props.
import clsx from "clsx";
import { FlaskConical, Heart, Minus, Plus, Star, X } from "lucide-react";
import {
  useEffect, useId, useRef, useState,
  type ButtonHTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, type LinkProps } from "react-router-dom";
import { formatRWF } from "@/lib/format";

/* ---------------- Buttons ---------------- */
type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger" | "whatsapp";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "bg-surface text-ink border border-line-strong/40 hover:border-ink/50 hover:bg-sunken/60",
  ghost: "text-ink-soft hover:bg-sunken",
  accent: "bg-accent-500 text-ink hover:brightness-95",
  danger: "bg-danger text-white hover:brightness-95",
  whatsapp: "bg-whatsapp text-white hover:brightness-110",
};
// Minimum 40px height; md/lg meet the 44px comfortable touch target.
const sizes: Record<Size, string> = {
  sm: "min-h-10 px-3.5 text-sm gap-1.5",
  md: "min-h-11 px-5 text-sm gap-2",
  lg: "min-h-12 px-6 text-base gap-2",
};
const base =
  "inline-flex items-center justify-center rounded-full font-semibold transition active:translate-y-px disabled:pointer-events-none disabled:opacity-45 text-center";

export function Button({
  variant = "primary", size = "md", className, type = "button", ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={clsx(base, variants[variant], sizes[size], className)} {...rest} />;
}

export function ButtonLink({
  variant = "primary", size = "md", className, ...rest
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={clsx(base, variants[variant], sizes[size], className)} {...rest} />;
}

/* ---------------- Badges ---------------- */
type Tone = "neutral" | "brand" | "accent" | "clay" | "danger" | "success";
const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-soft",
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-50 text-accent-700",
  clay: "bg-clay-50 text-clay-600",
  danger: "bg-danger-50 text-danger",
  success: "bg-brand-50 text-success",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Marks simulated features so mocks are never mistaken for real integrations. */
export function MockBadge({ label, className }: { label?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-md border border-dashed border-accent-700/40 bg-accent-50 px-2 py-0.5 text-[11px] font-semibold text-accent-700", className)}>
      <FlaskConical className="size-3" aria-hidden /> {label ?? t("mock.label")}
    </span>
  );
}

export type Freshness = "today" | "recent" | "old";
export const freshness = (days: number): Freshness => (days === 0 ? "today" : days <= 3 ? "recent" : "old");

/** Price-age label: icon + text, never colour alone. */
export function FreshnessBadge({ days, estimate }: { days: number; estimate?: boolean }) {
  const { t } = useTranslation();
  if (estimate) return <Badge tone="clay">{t("price.estimate")}</Badge>;
  const f = freshness(days);
  return (
    <Badge tone={f === "today" ? "success" : f === "recent" ? "neutral" : "accent"}>
      {f === "today" ? t("price.today") : t("price.daysAgo", { count: days })}
    </Badge>
  );
}

export function Price({ amount, compareAt, className }: { amount: number; compareAt?: number; className?: string }) {
  const { t } = useTranslation();
  return (
    <span className={clsx("tabular inline-flex items-baseline gap-2", className)}>
      <span className="font-semibold text-ink">{formatRWF(amount)}</span>
      {compareAt && compareAt > amount && (
        <span className="text-xs text-muted line-through"><span className="sr-only">{t("price.was")} </span>{formatRWF(compareAt)}</span>
      )}
    </span>
  );
}

/* ---------------- Images ---------------- */
const WIDTHS = [400, 800, 1200];

/**
 * Responsive local image (`/images/<key>-<w>.webp`) with a calm fallback.
 * All files are licence-checked; see frontend/ATTRIBUTION.md.
 */
export function Img({
  src, alt, className, sizes = "(min-width: 1024px) 25vw, 50vw", priority, fallback,
}: { src?: string; alt: string; className?: string; sizes?: string; priority?: boolean; fallback?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={clsx("grid place-items-center bg-sunken text-muted", className)} role="img" aria-label={alt}>
        <span className="text-3xl opacity-70" aria-hidden>{fallback ?? "🍽️"}</span>
      </div>
    );
  }
  return (
    <img
      src={`/images/${src}-800.webp`}
      srcSet={WIDTHS.map((w) => `/images/${src}-${w}.webp ${w}w`).join(", ")}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      onError={() => setFailed(true)}
      className={clsx("bg-sunken object-cover", className)}
    />
  );
}

/** Initials avatar — used for sample people so no real person's photo is attached to invented details. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className={clsx("grid shrink-0 place-items-center rounded-full bg-brand-100 font-display font-semibold text-brand-700", className)} aria-hidden>
      {initials}
    </span>
  );
}

/* ---------------- Controls ---------------- */
export function Stepper({ value, onChange, min = 0, max = 99, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center rounded-full border border-line-strong/40 bg-surface" role="group" aria-label={label}>
      <button type="button" className="grid size-10 place-items-center rounded-full text-ink-soft hover:bg-sunken disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={t("a11y.decrease", { label })}>
        <Minus className="size-4" />
      </button>
      <span className="tabular min-w-8 text-center text-sm font-semibold" aria-live="polite">{value}</span>
      <button type="button" className="grid size-10 place-items-center rounded-full text-ink-soft hover:bg-sunken disabled:opacity-40" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={t("a11y.increase", { label })}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function Rating({ value, count, sample }: { value: number; count?: number; sample?: boolean }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-soft" aria-label={t("a11y.rating", { value: value.toFixed(1) })}>
      <Star className="size-3.5 fill-accent-500 text-accent-500" aria-hidden />
      <span className="tabular font-semibold" aria-hidden>{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted" aria-hidden>({count})</span>}
      {sample && <span className="text-muted">· {t("mock.sample")}</span>}
    </span>
  );
}

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition",
        active ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong/40 bg-surface text-ink-soft hover:border-ink/50",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Radio group with roving focus (arrow keys) per WAI-ARIA APG. */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + options.length) % options.length;
    onChange(options[n].value);
    refs.current[n]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full flex-wrap rounded-full bg-sunken p-1">
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => { refs.current[i] = el; }}
          role="radio"
          aria-checked={value === o.value}
          tabIndex={value === o.value ? 0 : -1}
          type="button"
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKey(e, i)}
          className={clsx(
            "min-h-9 rounded-full px-3.5 text-xs font-semibold transition sm:text-sm",
            value === o.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FavoriteButton({ active, onToggle, label, className }: { active: boolean; onToggle: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      aria-pressed={active}
      aria-label={label}
      className={clsx("grid size-10 place-items-center rounded-full bg-surface/95 text-ink shadow-sm transition hover:scale-105", className)}
    >
      <Heart className={clsx("size-5", active ? "fill-danger text-danger" : "text-ink-soft")} aria-hidden />
    </button>
  );
}

/* ---------------- Forms ---------------- */
/** Label + control + help/error wired with ids for assistive tech. */
export function Field({ label, help, error, children, className }: {
  label: string; help?: string; error?: string | null; className?: string;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactElement;
}) {
  const id = useId();
  const describedBy = error ? `${id}-err` : help ? `${id}-help` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": !!error || undefined })}
      {error ? <span id={`${id}-err`} className="error-text" role="alert">{error}</span> : help ? <span id={`${id}-help`} className="help">{help}</span> : null}
    </div>
  );
}

/* ---------------- Dialog ---------------- */
/** Native <dialog>: focus trap, Escape and inert background for free. */
export function Dialog({ open, onClose, title, children, side }: { open: boolean; onClose: () => void; title: string; children: ReactNode; side?: "left" | "right" | "bottom" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { t } = useTranslation();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const pos = {
    left: "m-0 h-dvh max-h-dvh w-[min(86vw,360px)] rounded-r-2xl",
    right: "m-0 ml-auto h-dvh max-h-dvh w-[min(92vw,420px)] rounded-l-2xl",
    bottom: "mx-0 mb-0 mt-auto max-h-[85dvh] w-full max-w-full rounded-t-2xl sm:m-auto sm:max-w-lg sm:rounded-2xl",
  }[side ?? "bottom"];
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby={titleId}
      className={clsx("bg-canvas p-0 text-ink shadow-xl", pos)}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-sunken" aria-label={t("nav.close")}>
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </dialog>
  );
}

/* ---------------- Layout helpers ---------------- */
export function SectionHeader({ eyebrow, title, action, sub }: { eyebrow?: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
        {sub && <p className="mt-1.5 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, sub, children, eyebrow }: { title: string; sub?: string; children?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-2 text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, sub, action }: { icon: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600" aria-hidden>{icon}</div>
      <p className="text-lg font-semibold">{title}</p>
      {sub && <p className="mt-1 max-w-sm text-sm text-muted">{sub}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between text-sm text-muted">
        {label}
        {icon && <span className="text-brand-600" aria-hidden>{icon}</span>}
      </div>
      <p className="tabular mt-2 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg bg-sunken", className)} aria-hidden />;
}
