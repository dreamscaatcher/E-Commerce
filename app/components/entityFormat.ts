type ValueFormatMode = "auto" | "date" | "datetime";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  if (value && typeof value === "object") {
    const maybeInteger = value as { low?: number };
    if (typeof maybeInteger.low === "number") return maybeInteger.low;
  }
  return null;
}

type TemporalParts = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  nanosecond?: number;
  timeZoneOffsetSeconds?: number;
  timeZoneId?: string;
};

function parseTemporalObject(value: Record<string, unknown>): TemporalParts | null {
  const year = toNumber(value.year);
  const month = toNumber(value.month);
  const day = toNumber(value.day);
  if (year == null || month == null || day == null) return null;

  const hour = toNumber(value.hour);
  const minute = toNumber(value.minute);
  const second = toNumber(value.second);
  const nanosecond = toNumber(value.nanosecond);
  const timeZoneOffsetSeconds = toNumber(
    value.timeZoneOffsetSeconds ?? value.timezoneOffsetSeconds
  );
  const timeZoneId =
    typeof value.timeZoneId === "string" && value.timeZoneId.trim()
      ? value.timeZoneId
      : undefined;

  return {
    year,
    month,
    day,
    hour: hour ?? undefined,
    minute: minute ?? undefined,
    second: second ?? undefined,
    nanosecond: nanosecond ?? undefined,
    timeZoneOffsetSeconds: timeZoneOffsetSeconds ?? undefined,
    timeZoneId,
  };
}

function formatDateParts(parts: TemporalParts) {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function formatTimeZoneOffset(offsetSeconds: number) {
  const sign = offsetSeconds >= 0 ? "+" : "-";
  const abs = Math.abs(offsetSeconds);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  return `${sign}${pad2(hours)}:${pad2(minutes)}`;
}

function formatDateTimeParts(parts: TemporalParts) {
  const date = formatDateParts(parts);
  const hour = parts.hour ?? 0;
  const minute = parts.minute ?? 0;
  const second = parts.second ?? 0;

  let fraction = "";
  const ns = parts.nanosecond;
  if (typeof ns === "number" && Number.isFinite(ns) && ns > 0) {
    const ms = Math.floor(ns / 1_000_000);
    if (ms > 0) {
      fraction = `.${String(ms).padStart(3, "0")}`;
    }
  }

  const time = `${pad2(hour)}:${pad2(minute)}:${pad2(second)}${fraction}`;
  const offset =
    typeof parts.timeZoneOffsetSeconds === "number" &&
    Number.isFinite(parts.timeZoneOffsetSeconds)
      ? ` ${formatTimeZoneOffset(parts.timeZoneOffsetSeconds)}`
      : "";

  return `${date} ${time}${offset}`;
}

function formatNow(mode: ValueFormatMode): string {
  const now = new Date();
  const date = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  if (mode === "date") return date;
  const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  return `${date} ${time}`;
}

function inferModeFromKey(key: string): ValueFormatMode {
  const last = key.split(".").pop() ?? key;
  const lower = last.toLowerCase();
  if (lower.endsWith("date")) return "date";
  if (lower.endsWith("at")) return "datetime";
  return "auto";
}

export function normalizeValue(
  value: unknown,
  mode: ValueFormatMode = "auto"
): string {
  if (
    value == null ||
    (typeof value === "string" && value.trim() === "" && mode !== "auto")
  ) {
    return mode === "auto" ? "" : formatNow(mode);
  }

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeValue(entry, "auto"))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const maybeInteger = value as { low?: number; high?: number };
    if (typeof maybeInteger.low === "number") {
      return String(maybeInteger.low);
    }

    const temporal = parseTemporalObject(value as Record<string, unknown>);
    if (temporal) {
      if (mode === "date") {
        return formatDateParts(temporal);
      }
      const hasTime =
        typeof temporal.hour === "number" &&
        typeof temporal.minute === "number" &&
        typeof temporal.second === "number";
      return hasTime ? formatDateTimeParts(temporal) : formatDateParts(temporal);
    }

    try {
      const json = JSON.stringify(value);
      return json === "{}" ? "" : json;
    } catch {
      return String(value);
    }
  }

  return String(value);
}

export function formatValueForKey(key: string, value: unknown): string {
  return normalizeValue(value, inferModeFromKey(key));
}

export function getFieldValue(
  entity: Record<string, unknown>,
  key: string
): string {
  const parts = key.split(".");
  let current: unknown = entity;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return "";
    }
  }

  return formatValueForKey(key, current);
}
