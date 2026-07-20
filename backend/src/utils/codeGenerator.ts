const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

function randomSegment(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function generateRedemptionCode(): string {
  return `MC-${randomSegment(4)}-${randomSegment(4)}`;
}

/** `from` lets an already-active premium period extend instead of getting shortened by a new code. */
export function durationToDate(
  duration: "DAYS_30" | "MONTHS_6" | "LIFETIME",
  from: Date = new Date(),
): { until: Date | null; lifetime: boolean } {
  const base = from.getTime() > Date.now() ? from : new Date();
  if (duration === "DAYS_30") return { until: new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000), lifetime: false };
  if (duration === "MONTHS_6") return { until: new Date(base.getFullYear(), base.getMonth() + 6, base.getDate()), lifetime: false };
  return { until: null, lifetime: true };
}
