import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";
import { it } from "date-fns/locale";

export function asDate(value: string | Date): Date {
  return value instanceof Date ? value : parseISO(value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  return format(asDate(value), "d MMMM yyyy", { locale: it });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  return format(asDate(value), "d MMMM yyyy, HH:mm", { locale: it });
}

export function relativeTime(value: string | Date): string {
  const d = asDate(value);
  return formatDistanceToNow(d, { addSuffix: true, locale: it });
}

export function deadlineLabel(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = asDate(value);
  if (isPast(d)) return "Scaduta";
  return `Scade ${format(d, "d MMMM", { locale: it })}`;
}

export const CATEGORY_LABEL: Record<string, string> = {
  verbale: "Verbale",
  letteraria: "Letteraria",
  grafica: "Grafica",
  libera: "Libera",
};

export const STATUS_LABEL: Record<string, string> = {
  aperta: "Aperta",
  chiusa: "Chiusa",
  giudicata: "Giudicata",
};

export function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value ?? "");
}
