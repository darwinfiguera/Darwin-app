export type SemaphoreStatus = "green" | "yellow" | "red";

export function statusForPercent(percent: number): SemaphoreStatus {
  if (percent >= 100) return "red";
  if (percent >= 70) return "yellow";
  return "green";
}

/**
 * Friendly, non-punitive copy for budget alerts. Color carries the urgency;
 * the text always stays warm, per the product's "compañero financiero" tone.
 */
export function alertMessage(categoryName: string, percent: number): string {
  const status = statusForPercent(percent);
  const pct = Math.round(percent);
  if (status === "red") {
    return `Che, te pasaste del presupuesto en ${categoryName.toLowerCase()}, ¿repasamos juntos? 💬`;
  }
  if (status === "yellow") {
    return `Vas por el ${pct}% en ${categoryName.toLowerCase()}. Todavía te queda margen, pero vale la pena mirarlo.`;
  }
  return `Vas bien en ${categoryName.toLowerCase()}, usaste el ${pct}% del presupuesto. 👍`;
}

export function celebrationMessage(goalName: string): string {
  return `¡Felicitaciones! Llegaste a tu meta "${goalName}" 🎉 Se nota el esfuerzo.`;
}

export function goalNudgeMessage(percent: number): string | null {
  if (percent >= 90 && percent < 100) {
    return "¡Estás cerca, un empujón más! 🎉";
  }
  return null;
}
