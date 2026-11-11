export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function newId(prefix = "") {
  return prefix + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

export function bookingCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `MR-${out}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatAUD(value: number | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace(/\u00a0/g, " ");
}

export function formatDate(value: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString(
    "en-GB",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days: number, from = new Date()) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(iso: string) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

export function timeLabel(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % 1440) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function buildSlots(start: string, end: string, minutes: number) {
  const slots: string[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor < end && guard < 48) {
    slots.push(cursor);
    cursor = addMinutes(cursor, minutes);
    guard += 1;
  }
  return slots;
}

export const BOOKING_STATUS: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending review",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    className: "bg-sky-50 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
  },
  awaiting_payment: {
    label: "Awaiting payment",
    className: "bg-violet-50 text-violet-800 border-violet-200",
    dot: "bg-violet-500",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    className: "bg-stone-100 text-stone-700 border-stone-300",
    dot: "bg-stone-500",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-stone-100 text-stone-500 border-stone-200",
    dot: "bg-stone-400",
  },
};

export const BOOKING_STATUSES = Object.keys(BOOKING_STATUS);

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "Unpaid",
  deposit_paid: "Deposit paid",
  paid: "Fully paid",
  refunded: "Refunded",
};

export function stars(rating: number) {
  return "★★★★★".slice(0, Math.max(0, Math.min(5, rating)));
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}
